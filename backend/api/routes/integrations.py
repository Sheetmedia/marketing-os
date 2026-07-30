import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.deps import get_owned_client
from core.security import get_current_user
from models.client import Client
from models.gsc_connection import GoogleSearchConsoleConnection
from services.google_search_console import GoogleSearchConsoleService, build_auth_url

logger = logging.getLogger(__name__)
router = APIRouter()

STATE_PURPOSE = "gsc_oauth_state"
TOKEN_REFRESH_BUFFER = timedelta(minutes=2)


def _sign_state(client_id: str, agency_id: str) -> str:
    payload = {
        "purpose": STATE_PURPOSE,
        "client_id": client_id,
        "agency_id": agency_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _verify_state(state: str) -> dict:
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired state")
    if payload.get("purpose") != STATE_PURPOSE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")
    return payload


async def _get_connection(db: AsyncSession, client_id: str) -> Optional[GoogleSearchConsoleConnection]:
    result = await db.execute(
        select(GoogleSearchConsoleConnection).where(GoogleSearchConsoleConnection.client_id == client_id)
    )
    return result.scalar_one_or_none()


async def _valid_access_token(db: AsyncSession, connection: GoogleSearchConsoleConnection) -> str:
    """Return a usable access token, refreshing it first if it's expired/near-expiry."""
    now = datetime.now(timezone.utc)
    expires_at = connection.token_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at and expires_at - TOKEN_REFRESH_BUFFER > now:
        return connection.access_token

    service = GoogleSearchConsoleService()
    try:
        tokens = await service.refresh_access_token(connection.refresh_token)
    except httpx.HTTPStatusError as exc:
        logger.error("Failed to refresh Google OAuth token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Search Console connection expired. Please reconnect.",
        ) from exc
    finally:
        await service.close()

    connection.access_token = tokens["access_token"]
    connection.token_expires_at = now + timedelta(seconds=tokens.get("expires_in", 3600))
    await db.flush()
    await db.commit()
    return connection.access_token


def _guess_site_url(sites: list, domain: str) -> Optional[str]:
    """Best-effort match between a client's domain and their verified GSC properties."""
    clean_domain = domain.lower().replace("https://", "").replace("http://", "").rstrip("/")
    clean_domain = clean_domain[4:] if clean_domain.startswith("www.") else clean_domain
    for site in sites:
        site_url = site.get("siteUrl", "")
        candidate = site_url.replace("sc-domain:", "").replace("https://", "").replace("http://", "").rstrip("/")
        candidate = candidate[4:] if candidate.startswith("www.") else candidate
        if candidate == clean_domain:
            return site_url
    return None


@router.get("/google/auth-url")
async def get_google_auth_url(
    client_id: str,
    client: Client = Depends(get_owned_client),
    current_user: dict = Depends(get_current_user),
):
    """Return the Google consent-screen URL to connect Search Console for this client."""
    if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID/SECRET in the backend .env.",
        )
    state = _sign_state(client_id, current_user["agency_id"])
    return {"url": build_auth_url(state)}


@router.get("/google/callback")
async def google_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public redirect target Google sends the browser back to after consent."""
    if error or not code or not state:
        return RedirectResponse(f"{settings.FRONTEND_URL}/clients?gsc_error=1")

    payload = _verify_state(state)
    client_id = payload["client_id"]

    service = GoogleSearchConsoleService()
    try:
        tokens = await service.exchange_code(code)
        access_token = tokens["access_token"]
        sites = await service.list_sites(access_token)
    except (httpx.HTTPStatusError, KeyError) as exc:
        logger.error("Google OAuth callback failed for client %s: %s", client_id, exc)
        return RedirectResponse(f"{settings.FRONTEND_URL}/clients/{client_id}?gsc_error=1")
    finally:
        await service.close()

    client = await db.get(Client, client_id)
    site_url = _guess_site_url(sites, client.domain) if client else None

    connection = await _get_connection(db, client_id)
    now = datetime.now(timezone.utc)
    if not connection:
        connection = GoogleSearchConsoleConnection(client_id=client_id)
        db.add(connection)

    connection.access_token = access_token
    connection.refresh_token = tokens.get("refresh_token") or connection.refresh_token
    connection.token_expires_at = now + timedelta(seconds=tokens.get("expires_in", 3600))
    connection.site_url = site_url or connection.site_url
    connection.connected_at = connection.connected_at or now

    await db.flush()
    await db.commit()

    return RedirectResponse(f"{settings.FRONTEND_URL}/clients/{client_id}?gsc_connected=1")


@router.get("/google/{client_id}/status")
async def get_google_status(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    connection = await _get_connection(db, client_id)
    if not connection:
        return {"connected": False}
    return {
        "connected": True,
        "site_url": connection.site_url,
        "connected_at": connection.connected_at,
    }


@router.get("/google/{client_id}/sites")
async def list_google_sites(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List Search Console properties available to the connected Google account."""
    connection = await _get_connection(db, client_id)
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google Search Console is not connected")

    access_token = await _valid_access_token(db, connection)
    service = GoogleSearchConsoleService()
    try:
        sites = await service.list_sites(access_token)
    finally:
        await service.close()
    return {"sites": sites}


@router.put("/google/{client_id}/site")
async def set_google_site(
    client_id: str,
    site_url: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    connection = await _get_connection(db, client_id)
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google Search Console is not connected")
    connection.site_url = site_url
    await db.flush()
    await db.commit()
    return {"site_url": connection.site_url}


@router.get("/google/{client_id}/analytics")
async def get_google_analytics(
    client_id: str,
    days: int = 28,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Real organic search performance from Google Search Console."""
    connection = await _get_connection(db, client_id)
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google Search Console is not connected")
    if not connection.site_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Search Console property selected for this client yet. Call /sites and then PUT /site.",
        )

    access_token = await _valid_access_token(db, connection)
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)

    service = GoogleSearchConsoleService()
    try:
        totals = await service.query_search_analytics(
            access_token, connection.site_url, str(start_date), str(end_date), dimensions=[],
        )
        by_query = await service.query_search_analytics(
            access_token, connection.site_url, str(start_date), str(end_date),
            dimensions=["query"], row_limit=20,
        )
        by_page = await service.query_search_analytics(
            access_token, connection.site_url, str(start_date), str(end_date),
            dimensions=["page"], row_limit=20,
        )
    except httpx.HTTPStatusError as exc:
        logger.error("Search Console query failed for client %s: %s", client_id, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google Search Console request failed") from exc
    finally:
        await service.close()

    summary = (totals.get("rows") or [{}])[0]
    return {
        "data_source": "real",
        "site_url": connection.site_url,
        "date_range": {"start": str(start_date), "end": str(end_date)},
        "summary": {
            "clicks": summary.get("clicks", 0),
            "impressions": summary.get("impressions", 0),
            "ctr": summary.get("ctr", 0),
            "position": summary.get("position", 0),
        },
        "top_queries": [
            {
                "query": row["keys"][0],
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0),
                "position": row.get("position", 0),
            }
            for row in by_query.get("rows", [])
        ],
        "top_pages": [
            {
                "page": row["keys"][0],
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0),
                "position": row.get("position", 0),
            }
            for row in by_page.get("rows", [])
        ],
    }


@router.delete("/google/{client_id}/disconnect")
async def disconnect_google(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    connection = await _get_connection(db, client_id)
    if connection:
        await db.delete(connection)
        await db.flush()
        await db.commit()
    return {"status": "disconnected"}
