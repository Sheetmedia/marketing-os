from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class SocialAccountCreate(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    platform: str = Field(..., description="Social media platform name")
    account_name: str = Field(..., min_length=1, max_length=255, description="Account name or handle")
    access_token: Optional[str] = Field(None, description="Platform access token")
    refresh_token: Optional[str] = Field(None, description="Platform refresh token")


class SocialAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    platform: str
    account_name: str
    is_connected: bool = False
    followers_count: Optional[int] = None
    connected_at: Optional[datetime] = None
    created_at: datetime


class SocialPostCreate(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    account_id: UUID = Field(..., description="Social account ID")
    content: str = Field(..., min_length=1, description="Post content")
    media_urls: List[str] = Field(default_factory=list, description="Media attachment URLs")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled publish time")
    hashtags: List[str] = Field(default_factory=list, description="Hashtags")


class SocialPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    account_id: UUID
    platform: str
    content: str
    media_urls: List[str] = []
    status: str = "draft"
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    likes: Optional[int] = None
    shares: Optional[int] = None
    comments_count: Optional[int] = None
    reach: Optional[int] = None
    engagement_rate: Optional[float] = None
    created_at: datetime


class ContentCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    client_id: UUID
    month: int
    year: int
    posts: List[SocialPostResponse] = []
    total_scheduled: int = 0
    total_published: int = 0
    total_draft: int = 0
