from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class KeywordCreate(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=500, description="Keyword text")
    search_volume: Optional[int] = Field(None, ge=0, description="Monthly search volume")
    difficulty: Optional[float] = Field(None, ge=0, le=100, description="Keyword difficulty score")
    cpc: Optional[float] = Field(None, ge=0, description="Cost per click")
    intent: Optional[str] = Field(None, description="Search intent type")


class KeywordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    keyword: str
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    cpc: Optional[float] = None
    intent: Optional[str] = None
    current_rank: Optional[int] = None
    previous_rank: Optional[int] = None
    url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class KeywordGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Group name")
    client_id: UUID = Field(..., description="Client ID")
    keyword_ids: List[UUID] = Field(default_factory=list, description="Keyword IDs to include")


class KeywordGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    client_id: UUID
    keywords: List[KeywordResponse] = []
    created_at: datetime


class KeywordResearchRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    seed_keywords: List[str] = Field(..., min_length=1, description="Seed keywords for research")
    language: str = Field("en", description="Target language")
    country: str = Field("US", description="Target country code")
    limit: int = Field(50, ge=1, le=500, description="Maximum results to return")
