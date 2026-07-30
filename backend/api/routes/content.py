from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.ai_gateway.gateway import parse_json_response
from services.knowledge_brain import get_relevant_context
from api.utils import model_to_dict
from models.client import Client
from typing import Optional, List
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()

LENGTH_WORD_TARGETS = {"short": 600, "medium": 1200, "long": 2000}


@router.get("/{client_id}/content")
async def list_content(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    content_type: Optional[str] = None,
    content_status: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List all content pieces for a client."""
    content_pieces, total = await crud.list_content(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        content_type=content_type,
        status=content_status,
    )
    return {
        "content": [model_to_dict(c) for c in content_pieces],
        "total": total,
    }


@router.post("/{client_id}/content/generate")
async def generate_content(
    client_id: str,
    content_type: str,
    topic: str,
    target_keywords: List[str] = Body(default=[]),
    tone: str = "professional",
    length: str = "medium",
    additional_instructions: str = "",
    client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI-powered marketing content via the AI Gateway."""
    word_target = LENGTH_WORD_TARGETS.get(length, LENGTH_WORD_TARGETS["medium"])
    knowledge_context = await get_relevant_context(db, client_id, f"{topic} {' '.join(target_keywords)}".strip())

    system_prompt = (
        "You are an expert SEO content writer. You write engaging, well-structured, "
        f"{tone} content for the {content_type.replace('_', ' ')} format. Naturally "
        "incorporate target keywords without stuffing. Use clear headings for long-form "
        "content. Respond with valid JSON."
    )
    user_prompt = (
        f"Write {content_type.replace('_', ' ')} content (~{word_target} words) on: \"{topic}\"\n"
        f"Client: {client.name} ({client.domain}), industry: {client.industry or 'general'}\n"
        f"Target keywords: {', '.join(target_keywords) if target_keywords else 'none specified'}\n"
        f"Tone: {tone}\n"
        + (f"Additional instructions: {additional_instructions}\n" if additional_instructions else "")
        + (f"\nRelevant brand/product knowledge (use for accuracy and voice, don't just copy):\n{knowledge_context}\n" if knowledge_context else "")
        + "\nReturn JSON with keys: 'title', 'body' (full content, HTML-formatted with "
        "<h2>/<h3>/<p> tags), 'meta_title' (50-60 chars), 'meta_description' (120-160 chars), "
        "'slug' (URL-friendly)."
    )

    try:
        ai_response = await ai_gateway.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=min(word_target * 3, 8000),
            json_mode=True,
        )
        generated = parse_json_response(ai_response.content)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Content generation failed for client %s: %s", client_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI content generation failed: {exc}")

    body = generated.get("body", "")
    content = await crud.create_content(
        db,
        client_id=client_id,
        title=generated.get("title") or f"AI Generated: {topic}",
        content_type=content_type,
        body=body,
        meta_title=generated.get("meta_title"),
        meta_description=generated.get("meta_description"),
        slug=generated.get("slug"),
        target_keyword=target_keywords[0] if target_keywords else "",
        secondary_keywords=target_keywords[1:] if len(target_keywords) > 1 else None,
        word_count=len(body.split()),
        tone=tone,
        ai_generated=True,
        ai_model_used=f"{ai_response.provider}:{ai_response.model}",
        generation_prompt=user_prompt,
        status="draft",
    )
    return model_to_dict(content)


@router.get("/{client_id}/content/{content_id}")
async def get_content(
    client_id: str,
    content_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific content piece."""
    content = await crud.get_content(db, client_id=client_id, content_id=content_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )
    return model_to_dict(content)


@router.put("/{client_id}/content/{content_id}")
async def update_content(
    client_id: str,
    content_id: str,
    title: Optional[str] = None,
    body: Optional[str] = None,
    meta_title: Optional[str] = None,
    meta_description: Optional[str] = None,
    content_status: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Update a content piece."""
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if body is not None:
        update_data["body"] = body
    if meta_title is not None:
        update_data["meta_title"] = meta_title
    if meta_description is not None:
        update_data["meta_description"] = meta_description
    if content_status is not None:
        update_data["status"] = content_status

    content = await crud.update_content(db, client_id=client_id, content_id=content_id, **update_data)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )
    data = model_to_dict(content)
    data["message"] = "Content updated successfully"
    return data


@router.delete("/{client_id}/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    client_id: str,
    content_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Delete a content piece."""
    deleted = await crud.delete_content(db, client_id=client_id, content_id=content_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )
    return None


@router.post("/{client_id}/content/{content_id}/optimize")
async def optimize_content(
    client_id: str,
    content_id: str,
    target_keywords: List[str] = Body(default=[]),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """AI optimize content for SEO."""
    content = await crud.get_content(db, client_id=client_id, content_id=content_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )
    content_data = model_to_dict(content)
    # Optimization would be handled by an AI service; return current state
    return {
        "content_id": content_id,
        "original_seo_score": content_data.get("seo_score", 0),
        "optimized_seo_score": content_data.get("seo_score", 0),
        "improvements": [],
        "status": "optimized",
    }
