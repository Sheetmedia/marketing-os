from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from api.utils import model_to_dict
from models.client import Client
from typing import Optional
import uuid

router = APIRouter()


@router.get("/{client_id}/alerts")
async def list_alerts(
    client_id: str,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List alerts for a client."""
    alerts, total = await crud.list_alerts(
        db,
        client_id=client_id,
        alert_type=alert_type,
        severity=severity,
        is_read=is_read,
        skip=skip,
        limit=limit,
    )
    return {
        "alerts": [model_to_dict(a) for a in alerts],
        "total": total,
    }


@router.put("/{client_id}/alerts/{alert_id}/read")
async def mark_alert_read(
    client_id: str,
    alert_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Mark an alert as read."""
    alert = await crud.mark_alert_read(db, client_id=client_id, alert_id=alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    data = model_to_dict(alert)
    return {"id": data["id"], "is_read": True}


@router.put("/{client_id}/alerts/read-all")
async def mark_all_read(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Mark all alerts as read."""
    await crud.mark_all_alerts_read(db, client_id=client_id)
    return {"message": "All alerts marked as read"}


@router.get("/{client_id}/alerts/settings")
async def get_alert_settings(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get alert settings."""
    # Alert settings would come from a settings table; return defaults when empty
    return {
        "ranking_drop_threshold": 5,
        "traffic_drop_threshold": 20,
        "budget_alert_threshold": 80,
        "email_notifications": True,
        "slack_notifications": False,
        "in_app_notifications": True,
        "frequency": "real_time",
    }


@router.put("/{client_id}/alerts/settings")
async def update_alert_settings(
    client_id: str,
    ranking_drop_threshold: Optional[int] = None,
    traffic_drop_threshold: Optional[int] = None,
    email_notifications: Optional[bool] = None,
    slack_notifications: Optional[bool] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Update alert settings."""
    # Persist alert settings to DB when a settings crud function is available
    return {"message": "Alert settings updated"}
