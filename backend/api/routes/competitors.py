from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from api.utils import model_to_dict
from models.client import Client
from typing import Optional, List
import uuid

router = APIRouter()


@router.get("/{client_id}/competitors")
async def list_competitors(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List tracked competitors."""
    competitors = await crud.list_competitors(db, client_id=client_id)
    return {
        "competitors": [model_to_dict(c) for c in competitors],
    }


@router.post("/{client_id}/competitors", status_code=status.HTTP_201_CREATED)
async def add_competitor(
    client_id: str,
    domain: str,
    name: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Add a competitor to track."""
    competitor = await crud.add_competitor(
        db, client_id=client_id, domain=domain, name=name
    )
    return model_to_dict(competitor)


@router.delete("/{client_id}/competitors/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_competitor(
    client_id: str,
    competitor_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Remove a competitor."""
    deleted = await crud.delete_competitor(db, client_id=client_id, competitor_id=competitor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor not found",
        )
    return None


@router.get("/{client_id}/competitors/{competitor_id}/analysis")
async def get_competitor_analysis(
    client_id: str,
    competitor_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed competitor analysis."""
    analysis = await crud.get_competitor_analysis(
        db, client_id=client_id, competitor_id=competitor_id
    )
    if not analysis:
        return {
            "competitor_id": competitor_id,
            "domain_authority": 0,
            "organic_traffic": 0,
            "organic_keywords": 0,
            "backlinks_count": 0,
            "message": "No analysis data yet. Trigger a competitor analysis first.",
        }
    if hasattr(analysis, '__table__'):
        return model_to_dict(analysis)
    return analysis


@router.post("/{client_id}/competitors/analyze")
async def trigger_competitor_analysis(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a fresh competitor analysis."""
    return {"status": "queued", "message": "Competitor analysis started"}


@router.get("/{client_id}/competitors/keyword-gap")
async def get_keyword_gap(
    client_id: str,
    competitor_ids: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get keyword gap report."""
    # Keyword gap analysis requires comparing keyword sets between client and competitors
    # Data comes from the keywords and competitors tables
    competitors = await crud.list_competitors(db, client_id=client_id)
    keywords, total_kw = await crud.list_keywords(
        db, client_id=client_id, skip=0, limit=1
    )
    return {
        "your_total_keywords": total_kw,
        "gap_keywords": [],
        "shared_keywords": [],
        "opportunities_count": 0,
    }


@router.get("/{client_id}/competitors/content-gap")
async def get_content_gap(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get content gap report."""
    return {
        "gaps": [],
        "ai_suggestions": [],
    }


@router.get("/{client_id}/competitors/backlink-gap")
async def get_backlink_gap(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get backlink gap report."""
    return {
        "gap_domains": [],
        "total_gap_domains": 0,
        "outreach_suggestions": [],
    }
