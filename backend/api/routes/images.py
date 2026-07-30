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
from datetime import datetime, timezone

router = APIRouter()

IMAGE_DIMENSIONS = {
    "instagram": (1080, 1080),
    "facebook_ad": (1200, 628),
    "linkedin_banner": (1584, 396),
    "blog_thumbnail": (1200, 630),
    "website_banner": (1920, 600),
    "youtube_thumbnail": (1280, 720),
}


@router.post("/{client_id}/images/generate")
async def generate_image(
    client_id: str,
    prompt: str,
    image_type: str = "instagram",
    style: str = "photorealistic",
    brand_colors: List[str] = [],
    text_overlay: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Generate a marketing image using AI."""
    width, height = IMAGE_DIMENSIONS.get(image_type, (1080, 1080))
    image = await crud.create_generated_image(
        db,
        client_id=client_id,
        prompt=prompt,
        usage_type=image_type,
        style=style,
        width=width,
        height=height,
        image_url=f"/generated/{uuid.uuid4()}.png",
    )
    return model_to_dict(image)


@router.get("/{client_id}/images")
async def list_images(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    image_type: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List generated images."""
    images, total = await crud.list_generated_images(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        image_type=image_type,
    )
    return {
        "images": [model_to_dict(i) for i in images],
        "total": total,
    }


@router.get("/{client_id}/images/{image_id}")
async def get_image(
    client_id: str,
    image_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get image details."""
    images, _ = await crud.list_generated_images(
        db, client_id=client_id, skip=0, limit=1
    )
    # Find specific image by iterating or use a get function
    # For now, list and filter
    all_images, _ = await crud.list_generated_images(
        db, client_id=client_id, skip=0, limit=1000
    )
    image = None
    for img in all_images:
        img_data = model_to_dict(img)
        if img_data.get("id") == image_id:
            image = img
            break
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    return model_to_dict(image)


@router.delete("/{client_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    client_id: str,
    image_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Delete a generated image."""
    deleted = await crud.delete_generated_image(db, client_id=client_id, image_id=image_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    return None
