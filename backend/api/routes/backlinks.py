from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from services.backlink_monitor import BacklinkMonitorService
from api.utils import model_to_dict
from models.backlink import Backlink, BacklinkProfile
from models.client import Client
from typing import Optional
import uuid
from datetime import datetime, timezone

router = APIRouter()


def _serialize_backlink(b: Backlink) -> dict:
    data = model_to_dict(b)
    data["status"] = "active" if data.get("is_active") else "lost"
    return data


@router.get("/{client_id}/backlinks")
async def list_backlinks(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    rel_type: Optional[str] = None,
    min_da: Optional[int] = None,
    search: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List backlinks with filtering."""
    backlinks, total = await crud.list_backlinks(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        status=status,
        rel_type=rel_type,
        min_da=min_da,
        search=search,
    )
    return {
        "backlinks": [_serialize_backlink(b) for b in backlinks],
        "total": total,
    }


@router.get("/{client_id}/backlinks/profile")
async def get_backlink_profile(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get backlink profile summary."""
    profile = await crud.get_backlink_profile(db, client_id=client_id)
    if not profile:
        return {
            "total_backlinks": 0,
            "referring_domains": 0,
            "avg_domain_authority": 0,
            "spam_score": 0,
            "new_backlinks_30d": 0,
            "lost_backlinks_30d": 0,
            "follow_ratio": 0,
            "da_distribution": [],
            "trend": [],
        }
    return profile


@router.post("/{client_id}/backlinks/analyze")
async def analyze_backlinks(
    client_id: str,
    client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a client's domain and (re)build its backlink profile.

    Requires BACKLINK_API_KEY (a third-party provider like Ahrefs, Moz,
    Majestic, or DataForSEO) to return real data. Without one configured,
    this honestly returns an empty profile rather than fabricating numbers.
    """
    domain = client.domain or "example.com"

    profile = await crud.get_backlink_profile(db, client_id=client_id)
    if not profile:
        profile = BacklinkProfile(id=uuid.uuid4(), client_id=client_id)
        db.add(profile)
        await db.flush()
    else:
        await db.execute(delete(Backlink).where(Backlink.profile_id == profile.id))

    monitor = BacklinkMonitorService()
    try:
        analysis = await monitor.analyze_backlinks(domain)
    finally:
        await monitor.close()

    backlinks = analysis.get("backlinks", [])
    now = datetime.now(timezone.utc)
    total_da = 0.0
    total_spam = 0.0

    for b in backlinks:
        da = b.get("domain_authority") or 0
        spam = b.get("spam_score") or 0
        total_da += da
        total_spam += spam
        db.add(Backlink(
            id=uuid.uuid4(),
            profile_id=profile.id,
            source_url=b.get("source_url", ""),
            target_url=b.get("target_url") or f"https://{domain}",
            anchor_text=b.get("anchor_text", ""),
            rel_type="nofollow" if b.get("rel") == "nofollow" else "dofollow",
            domain_authority=da,
            page_authority=b.get("page_authority") or 0,
            spam_score=spam,
            is_active=b.get("is_active", True),
            first_seen=b.get("first_seen") or now,
            last_seen=b.get("last_seen") or now,
        ))

    num_backlinks = len(backlinks)
    profile.total_backlinks = num_backlinks
    profile.referring_domains = analysis.get("referring_domains", 0)
    profile.domain_authority = round(total_da / num_backlinks, 1) if num_backlinks else 0
    profile.spam_score = round(total_spam / num_backlinks, 1) if num_backlinks else 0
    profile.dofollow_count = analysis.get("dofollow_count", 0)
    profile.nofollow_count = analysis.get("nofollow_count", 0)
    profile.last_crawled_at = now

    await db.flush()
    await db.commit()

    if num_backlinks:
        message = f"Found {num_backlinks} backlinks from {profile.referring_domains} referring domains"
    else:
        message = (
            "No backlink data provider configured (BACKLINK_API_KEY is empty). "
            "Connect a provider like Ahrefs, Moz, Majestic, or DataForSEO to see real backlinks."
        )

    return {
        "status": "completed",
        "message": message,
        "total_backlinks": num_backlinks,
        "referring_domains": profile.referring_domains,
        "data_source": "real" if settings.BACKLINK_API_KEY else "not_configured",
    }


@router.get("/{client_id}/backlinks/lost")
async def get_lost_backlinks(
    client_id: str,
    days: int = 30,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get recently lost backlinks."""
    backlinks, total = await crud.list_backlinks(
        db, client_id=client_id, skip=0, limit=100, status="lost"
    )
    return {
        "lost_backlinks": [model_to_dict(b) for b in backlinks],
        "total": total,
    }


@router.get("/{client_id}/backlinks/new")
async def get_new_backlinks(
    client_id: str,
    days: int = 30,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get newly discovered backlinks."""
    backlinks, total = await crud.list_backlinks(
        db, client_id=client_id, skip=0, limit=100, status="active"
    )
    return {
        "new_backlinks": [model_to_dict(b) for b in backlinks],
        "total": total,
    }
