from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client, get_owned_campaign, require_role
from services import crud
from services.ai_gateway import NoProviderConfiguredError
from services.campaigns import generate_campaign_plan
from services.knowledge_brain import get_relevant_context
from api.utils import model_to_dict
from models.client import Client
from models.campaign import Campaign
from typing import Optional, List
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def list_campaigns(
    skip: int = 0,
    limit: int = 20,
    campaign_type: Optional[str] = None,
    campaign_status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List marketing campaigns."""
    campaigns, total = await crud.list_campaigns(
        db,
        agency_id=current_user.get("agency_id"),
        skip=skip,
        limit=limit,
        campaign_type=campaign_type,
        status=campaign_status,
    )
    return {
        "campaigns": [model_to_dict(c) for c in campaigns],
        "total": total,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    name: str,
    client_id: str,
    campaign_type: str,
    start_date: datetime,
    end_date: datetime,
    budget: float,
    goals: List[str] = Body(default=[]),
    channels: List[str] = Body(default=[]),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Create a marketing campaign."""
    campaign = await crud.create_campaign(
        db,
        name=name,
        client_id=client_id,
        campaign_type=campaign_type,
        start_date=start_date,
        end_date=end_date,
        budget=budget,
        goals=goals,
        channels=channels,
    )
    return model_to_dict(campaign)


@router.get("/{campaign_id}")
async def get_campaign(
    campaign: Campaign = Depends(get_owned_campaign),
):
    """Get campaign details."""
    return model_to_dict(campaign)


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    name: Optional[str] = None,
    status_val: Optional[str] = None,
    _campaign: Campaign = Depends(get_owned_campaign),
    db: AsyncSession = Depends(get_db),
):
    """Update a campaign."""
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if status_val is not None:
        update_data["status"] = status_val

    campaign = await crud.update_campaign(db, campaign_id=campaign_id, **update_data)
    data = model_to_dict(campaign)
    data["message"] = "Campaign updated"
    return data


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: str,
    _campaign: Campaign = Depends(get_owned_campaign),
    _role: dict = Depends(require_role("agency_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a campaign. Requires agency_admin."""
    await crud.delete_campaign(db, campaign_id=campaign_id)
    return None


@router.get("/{campaign_id}/metrics")
async def get_campaign_metrics(
    campaign_id: str,
    _campaign: Campaign = Depends(get_owned_campaign),
    db: AsyncSession = Depends(get_db),
):
    """Get campaign performance metrics."""
    metrics = await crud.get_campaign_metrics(db, campaign_id=campaign_id)
    if not metrics:
        return {
            "campaign_id": campaign_id,
            "impressions": 0,
            "clicks": 0,
            "conversions": 0,
            "spend": 0,
            "revenue": 0,
            "ctr": 0,
            "cpc": 0,
            "roas": 0,
            "daily_metrics": [],
        }
    return metrics


@router.post("/{campaign_id}/generate-plan")
async def generate_plan(
    campaign_id: str,
    campaign: Campaign = Depends(get_owned_campaign),
    db: AsyncSession = Depends(get_db),
):
    """AI-generate a creative brief, audience segmentation, and a per-channel
    budget allocation for this campaign, grounded in the client's profile and
    the campaign's own type/budget/goals."""
    client = await crud.get_client(db, client_id=str(campaign.client_id))
    query = f"{campaign.name} {campaign.campaign_type} campaign " + " ".join(campaign.goals or [])
    knowledge_context = await get_relevant_context(db, str(campaign.client_id), query)

    try:
        generated = await generate_campaign_plan(client, campaign, knowledge_context)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Campaign plan generation failed for %s: %s", campaign_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Campaign plan generation failed: {exc}")

    updated = await crud.update_campaign(
        db,
        campaign_id=campaign_id,
        brief=generated.get("brief"),
        audience_segments=generated.get("audience_segments"),
        budget_allocation=generated.get("budget_allocation"),
        channels=generated.get("channels") or campaign.channels,
        ai_model_used=generated.get("ai_model_used"),
    )
    return model_to_dict(updated)


@router.post("/{campaign_id}/launch")
async def launch_campaign(
    campaign_id: str,
    _campaign: Campaign = Depends(get_owned_campaign),
    _role: dict = Depends(require_role("agency_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Launch a campaign. Requires agency_admin."""
    campaign = await crud.update_campaign(
        db, campaign_id=campaign_id, status="active"
    )
    data = model_to_dict(campaign)
    return {
        "id": data["id"],
        "status": "active",
        "launched_at": datetime.now(timezone.utc).isoformat(),
    }
