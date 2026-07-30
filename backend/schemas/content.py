from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ContentGenerateRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    topic: str = Field(..., min_length=1, description="Content topic")
    content_type: str = Field("blog_post", description="Type of content to generate")
    keywords: List[str] = Field(default_factory=list, description="Target keywords")
    tone: str = Field("professional", description="Content tone")
    word_count: int = Field(1000, ge=100, le=10000, description="Target word count")
    language: str = Field("en", description="Content language")


class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    title: str
    content: str
    content_type: str
    status: str = "draft"
    seo_score: Optional[float] = None
    readability_score: Optional[float] = None
    keywords: List[str] = []
    meta_description: Optional[str] = None
    word_count: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ContentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, description="Updated title")
    content: Optional[str] = Field(None, description="Updated content")
    status: Optional[str] = Field(None, description="Updated status")
    meta_description: Optional[str] = Field(None, description="Updated meta description")
    keywords: Optional[List[str]] = Field(None, description="Updated keywords")


class ContentOptimizeRequest(BaseModel):
    content_id: UUID = Field(..., description="Content ID to optimize")
    target_keywords: List[str] = Field(..., min_length=1, description="Target keywords")
    optimization_level: str = Field("moderate", description="Optimization level: light, moderate, aggressive")
