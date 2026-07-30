from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from services import crud
from models.client import Client
from models.campaign import Campaign

VALID_ROLES = {"agency_admin", "agency_member"}


async def get_owned_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """Resolve client_id and verify it belongs to the caller's agency.

    Raises 404 (not 403) on mismatch so cross-agency requests can't
    distinguish "doesn't exist" from "exists but isn't yours".
    """
    agency_id = current_user.get("agency_id")
    client = await crud.get_client(db, client_id=client_id)
    if not client or not agency_id or str(client.agency_id) != str(agency_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


async def get_owned_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Campaign:
    """Resolve campaign_id and verify its client belongs to the caller's agency."""
    campaign = await crud.get_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    agency_id = current_user.get("agency_id")
    client = await crud.get_client(db, client_id=str(campaign.client_id))
    if not client or not agency_id or str(client.agency_id) != str(agency_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


def require_role(*allowed_roles: str):
    """FastAPI dependency factory: reject the request with 403 unless the
    caller's role is in allowed_roles."""
    async def checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker
