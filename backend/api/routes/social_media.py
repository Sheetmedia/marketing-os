from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from api.utils import model_to_dict
from models.client import Client
from typing import Optional, List
import uuid
from datetime import datetime, timezone

router = APIRouter()


@router.get("/{client_id}/accounts")
async def list_social_accounts(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List connected social media accounts."""
    accounts = await crud.list_social_accounts(db, client_id=client_id)
    return {
        "accounts": [model_to_dict(a) for a in accounts],
    }


@router.post("/{client_id}/accounts", status_code=status.HTTP_201_CREATED)
async def connect_account(
    client_id: str,
    platform: str,
    account_name: str,
    access_token: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Connect a social media account."""
    account = await crud.create_social_account(
        db,
        client_id=client_id,
        platform=platform,
        account_name=account_name,
        access_token=access_token,
    )
    return model_to_dict(account)


@router.get("/{client_id}/posts")
async def list_posts(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    platform: Optional[str] = None,
    post_status: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List social media posts."""
    posts, total = await crud.list_social_posts(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        platform=platform,
        status=post_status,
    )
    return {
        "posts": [model_to_dict(p) for p in posts],
        "total": total,
    }


@router.post("/{client_id}/posts", status_code=status.HTTP_201_CREATED)
async def create_post(
    client_id: str,
    content: str,
    platform: str,
    scheduled_at: Optional[str] = None,
    media_urls: List[str] = Body(default=[]),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Create or schedule a social media post."""
    post = await crud.create_social_post(
        db,
        client_id=client_id,
        content=content,
        platform=platform,
        scheduled_at=scheduled_at,
        media_urls=media_urls,
    )
    return model_to_dict(post)


@router.put("/{client_id}/posts/{post_id}")
async def update_post(
    client_id: str,
    post_id: str,
    content: Optional[str] = None,
    scheduled_at: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Update a social media post."""
    update_data = {}
    if content is not None:
        update_data["content"] = content
    if scheduled_at is not None:
        update_data["scheduled_at"] = scheduled_at

    post = await crud.update_social_post(db, client_id=client_id, post_id=post_id, **update_data)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    data = model_to_dict(post)
    data["message"] = "Post updated successfully"
    return data


@router.delete("/{client_id}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    client_id: str,
    post_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Delete a social media post."""
    deleted = await crud.delete_social_post(db, client_id=client_id, post_id=post_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return None


@router.get("/{client_id}/calendar")
async def get_content_calendar(
    client_id: str,
    month: int = 6,
    year: int = 2024,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get content calendar for a month."""
    posts, _ = await crud.list_social_posts(
        db, client_id=client_id, skip=0, limit=1000, status="scheduled"
    )
    # Group posts by date for calendar view
    entries = {}
    for post in posts:
        post_data = model_to_dict(post)
        scheduled = post_data.get("scheduled_at")
        if scheduled:
            date_str = scheduled[:10] if isinstance(scheduled, str) else scheduled.isoformat()[:10]
            if date_str not in entries:
                entries[date_str] = []
            entries[date_str].append({
                "id": post_data.get("id"),
                "platform": post_data.get("platform"),
                "content": post_data.get("content", "")[:50],
                "time": scheduled[11:16] if isinstance(scheduled, str) and len(scheduled) > 16 else "",
            })

    return {
        "month": month,
        "year": year,
        "entries": [{"date": date, "posts": posts_list} for date, posts_list in sorted(entries.items())],
    }


@router.post("/{client_id}/posts/{post_id}/publish")
async def publish_post(
    client_id: str,
    post_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Publish a post immediately."""
    post = await crud.update_social_post(
        db,
        client_id=client_id,
        post_id=post_id,
        status="published",
        published_at=datetime.now(timezone.utc),
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    data = model_to_dict(post)
    return {"id": data["id"], "status": "published", "published_at": data.get("published_at")}


@router.get("/{client_id}/analytics")
async def get_social_analytics(
    client_id: str,
    days: int = 30,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get social media analytics."""
    accounts = await crud.list_social_accounts(db, client_id=client_id)
    posts, total_posts = await crud.list_social_posts(
        db, client_id=client_id, skip=0, limit=1000
    )

    total_followers = 0
    platform_breakdown = []
    for acc in accounts:
        acc_data = model_to_dict(acc)
        total_followers += acc_data.get("followers_count", 0)
        platform_breakdown.append({
            "platform": acc_data.get("platform"),
            "followers": acc_data.get("followers_count", 0),
            "engagement_rate": 0,
            "posts": 0,
        })

    return {
        "total_followers": total_followers,
        "follower_growth": 0,
        "engagement_rate": 0,
        "total_posts": total_posts,
        "total_reach": 0,
        "best_platform": platform_breakdown[0]["platform"] if platform_breakdown else None,
        "daily_engagement": [],
        "platform_breakdown": platform_breakdown,
    }
