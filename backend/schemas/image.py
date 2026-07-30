from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ImageGenerateRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    prompt: str = Field(..., min_length=1, max_length=2000, description="Image generation prompt")
    style: str = Field("realistic", description="Image style")
    width: int = Field(1024, ge=256, le=4096, description="Image width in pixels")
    height: int = Field(1024, ge=256, le=4096, description="Image height in pixels")
    format: str = Field("png", description="Output format: png, jpg, webp")


class ImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    prompt: str
    image_url: str
    thumbnail_url: Optional[str] = None
    width: int
    height: int
    format: str
    file_size: Optional[int] = None
    created_at: datetime
