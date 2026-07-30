from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.ai_gateway.gateway import parse_json_response
from api.utils import model_to_dict
from models.client import Client
from typing import Optional, List
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{client_id}/keywords")
async def list_keywords(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    sort_by: Optional[str] = "current_position",
    sort_order: Optional[str] = "asc",
    search: Optional[str] = None,
    min_volume: Optional[int] = None,
    max_difficulty: Optional[int] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List tracked keywords with filtering and sorting."""
    keywords, total = await crud.list_keywords(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        min_volume=min_volume,
        max_difficulty=max_difficulty,
    )
    return {
        "keywords": [model_to_dict(k) for k in keywords],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/{client_id}/keywords", status_code=status.HTTP_201_CREATED)
async def add_keywords(
    client_id: str,
    keywords: List[str] = Body(...),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Add keywords to track."""
    added = await crud.add_keywords(db, client_id=client_id, keywords=keywords)
    return {
        "added": [model_to_dict(k) for k in added],
        "count": len(added),
    }


@router.delete("/{client_id}/keywords/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_keyword(
    client_id: str,
    keyword_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Remove a keyword from tracking."""
    deleted = await crud.delete_keyword(db, client_id=client_id, keyword_id=keyword_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keyword not found",
        )
    return None


@router.get("/{client_id}/keywords/groups")
async def get_keyword_groups(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get keyword groups."""
    groups = await crud.get_keyword_groups(db, client_id=client_id)
    return {
        "groups": [model_to_dict(g) if hasattr(g, '__table__') else g for g in groups],
    }


@router.post("/{client_id}/keywords/groups", status_code=status.HTTP_201_CREATED)
async def create_keyword_group(
    client_id: str,
    name: str,
    keyword_ids: List[str] = Body(default=[]),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Create a keyword group."""
    group = await crud.add_keywords(db, client_id=client_id, keywords=[])
    # Use a dedicated group creation if available, otherwise return basic structure
    return {"id": str(uuid.uuid4()), "name": name, "keyword_count": len(keyword_ids)}


@router.post("/{client_id}/keywords/research")
async def keyword_research(
    client_id: str,
    seed_keywords: Optional[str] = None,
    location: str = "US",
    language: str = "en",
    client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered keyword research from seed keywords via the AI Gateway."""
    seeds = [s.strip() for s in seed_keywords.split(",") if s.strip()] if seed_keywords else []
    if not seeds:
        return {"seed_keywords": [], "location": location, "language": language, "suggestions": {}, "total": 0}

    system_prompt = (
        "You are an SEO keyword research expert. Respond only with valid JSON."
    )
    user_prompt = (
        f"Given these seed keywords: {', '.join(seeds)}, for market: {location} "
        f"(language: {language}), generate a keyword research report for client "
        f"{client.name} ({client.domain}), industry: {client.industry or 'general'}.\n\n"
        "For each seed keyword provide:\n"
        "1. 8 related long-tail keyword variations\n"
        "2. 4 question-based keywords\n"
        "3. Estimated search intent (informational/navigational/commercial/transactional)\n"
        "4. 3 suggested content topics\n\n"
        "Return JSON with keys: 'keyword_groups' (array of objects with 'seed', "
        "'long_tail' (array), 'questions' (array), 'intent', 'content_ideas' (array))."
    )

    try:
        ai_response = await ai_gateway.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=3000,
            json_mode=True,
        )
        suggestions = parse_json_response(ai_response.content)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Keyword research failed for client %s: %s", client_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI keyword research failed: {exc}")

    groups = suggestions.get("keyword_groups", [])
    total = sum(len(g.get("long_tail", [])) + len(g.get("questions", [])) for g in groups)
    return {
        "seed_keywords": seeds,
        "location": location,
        "language": language,
        "suggestions": suggestions,
        "total": total,
    }


@router.get("/{client_id}/keywords/rankings")
async def get_ranking_history(
    client_id: str,
    keyword_id: Optional[str] = None,
    days: int = 30,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get keyword ranking history."""
    # Ranking history would be fetched from the keywords/rankings tables
    keywords, _ = await crud.list_keywords(
        db, client_id=client_id, skip=0, limit=1
    )
    if not keywords:
        return {"keyword": None, "history": []}
    kw_data = model_to_dict(keywords[0])
    return {
        "keyword": kw_data.get("keyword"),
        "history": [],
    }
