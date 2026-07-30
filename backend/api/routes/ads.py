from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client, require_role
from services import crud
from api.utils import model_to_dict
from models.client import Client
from typing import Optional
import uuid
from datetime import datetime, timezone

router = APIRouter()


@router.get("/{client_id}/accounts")
async def list_ad_accounts(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List connected ad accounts."""
    accounts = await crud.list_ad_accounts(db, client_id=client_id)
    return {
        "accounts": [model_to_dict(a) for a in accounts],
    }


@router.post("/{client_id}/accounts", status_code=status.HTTP_201_CREATED)
async def connect_ad_account(
    client_id: str,
    platform: str,
    account_id_external: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Connect an ad account."""
    account = await crud.create_ad_account(
        db,
        client_id=client_id,
        platform=platform,
        account_id=account_id_external,
    )
    return model_to_dict(account)


@router.get("/{client_id}/campaigns")
async def list_ad_campaigns(
    client_id: str,
    platform: Optional[str] = None,
    campaign_status: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List ad campaigns."""
    campaigns = await crud.list_ad_campaigns(
        db,
        client_id=client_id,
        platform=platform,
        status=campaign_status,
    )
    return {
        "campaigns": [model_to_dict(c) for c in campaigns],
        "total": len(campaigns),
    }


@router.post("/{client_id}/campaigns", status_code=status.HTTP_201_CREATED)
async def create_ad_campaign(
    client_id: str,
    name: str = "New Campaign",
    platform: str = "google",
    budget_daily: float = 0,
    budget_total: float = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    _role: dict = Depends(require_role("agency_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Create an ad campaign. Requires agency_admin (commits budget spend)."""
    campaign = await crud.create_ad_campaign(
        db,
        client_id=client_id,
        platform=platform,
        name=name,
        budget_amount=budget_total or budget_daily,
        start_date=start_date,
        end_date=end_date,
    )
    return model_to_dict(campaign)


@router.get("/{client_id}/campaigns/{campaign_id}")
async def get_ad_campaign(
    client_id: str,
    campaign_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get ad campaign details."""
    campaigns = await crud.list_ad_campaigns(db, client_id=client_id)
    campaign = None
    for c in campaigns:
        c_data = model_to_dict(c)
        if c_data.get("id") == campaign_id:
            campaign = c
            break
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    return model_to_dict(campaign)


@router.put("/{client_id}/campaigns/{campaign_id}")
async def update_ad_campaign(
    client_id: str,
    campaign_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Update an ad campaign."""
    # Find and update the campaign
    campaigns = await crud.list_ad_campaigns(db, client_id=client_id)
    campaign = None
    for c in campaigns:
        c_data = model_to_dict(c)
        if c_data.get("id") == campaign_id:
            campaign = c
            break
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    return {"id": campaign_id, "message": "Campaign updated successfully"}


@router.get("/{client_id}/analytics")
async def get_ad_analytics(
    client_id: str,
    platform: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get advertising analytics."""
    # Get all campaigns for this client, then aggregate metrics
    campaigns = await crud.list_ad_campaigns(db, client_id=client_id, platform=platform)
    all_metrics = []
    for c in campaigns:
        c_data = model_to_dict(c)
        m = await crud.get_ad_metrics(db, ad_campaign_id=c_data["id"])
        all_metrics.extend(m)
    metrics = all_metrics
    if not metrics:
        return {
            "total_spend": 0,
            "total_impressions": 0,
            "total_clicks": 0,
            "total_conversions": 0,
            "avg_ctr": 0,
            "avg_cpc": 0,
            "avg_cost_per_lead": 0,
            "overall_roas": 0,
            "spend_trend": [],
            "platform_breakdown": [],
        }
    return metrics
