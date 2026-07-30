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


@router.get("/")
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all clients with pagination and filtering."""
    clients, total = await crud.list_clients(
        db, agency_id=current_user.get("agency_id"), skip=skip, limit=limit,
        status=status, industry=industry, search=search,
    )
    return {
        "clients": [model_to_dict(c) for c in clients],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_client(
    name: str,
    domain: str,
    industry: str,
    marketing_goals: str = "",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new client."""
    agency_id = current_user.get("agency_id")
    if not agency_id:
        raise HTTPException(status_code=400, detail="User has no agency assigned")

    client = await crud.create_client(
        db,
        agency_id=agency_id,
        name=name,
        domain=domain,
        industry=industry,
        marketing_goals=marketing_goals,
    )
    return model_to_dict(client)


@router.get("/{client_id}")
async def get_client(
    client: Client = Depends(get_owned_client),
):
    """Get client details."""
    return model_to_dict(client)


@router.put("/{client_id}")
async def update_client(
    client_id: str,
    name: Optional[str] = None,
    domain: Optional[str] = None,
    industry: Optional[str] = None,
    status_val: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Update client details."""
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if domain is not None:
        update_data["domain"] = domain
    if industry is not None:
        update_data["industry"] = industry
    if status_val is not None:
        update_data["status"] = status_val

    client = await crud.update_client(db, client_id=client_id, **update_data)
    return model_to_dict(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    _role: dict = Depends(require_role("agency_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a client. Requires agency_admin."""
    await crud.delete_client(db, client_id=client_id)
    return None


@router.get("/{client_id}/dashboard")
async def get_client_dashboard(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get client dashboard summary with key metrics."""
    stats = await crud.get_client_dashboard_stats(db, client_id=client_id)
    if not stats:
        return {
            "client_id": client_id,
            "seo_score": 0,
            "domain_authority": 0,
            "organic_traffic": 0,
            "organic_traffic_change": 0,
            "total_keywords": 0,
            "keywords_in_top_10": 0,
            "total_backlinks": 0,
            "new_backlinks_30d": 0,
            "active_campaigns": 0,
            "content_pieces": 0,
            "alerts": {"critical": 0, "warning": 0, "info": 0},
            "traffic_trend": [],
        }
    return stats
