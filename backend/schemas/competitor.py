from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class CompetitorCreate(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    name: str = Field(..., min_length=1, max_length=255, description="Competitor name")
    website_url: str = Field(..., description="Competitor website URL")
    notes: Optional[str] = Field(None, description="Notes about the competitor")


class CompetitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    name: str
    website_url: str
    domain_authority: Optional[float] = None
    organic_traffic: Optional[int] = None
    keyword_count: Optional[int] = None
    backlink_count: Optional[int] = None
    notes: Optional[str] = None
    last_analyzed: Optional[datetime] = None
    created_at: datetime


class CompetitorAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    competitor_id: UUID
    client_id: UUID
    domain_authority_gap: Optional[float] = None
    traffic_gap: Optional[int] = None
    common_keywords: List[str] = []
    competitor_only_keywords: List[str] = []
    client_only_keywords: List[str] = []
    content_gap_topics: List[str] = []
    backlink_gap: Optional[int] = None
    top_performing_pages: List[Dict[str, str]] = []
    analyzed_at: datetime


class GapReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    client_id: UUID
    competitors: List[CompetitorAnalysisResponse] = []
    keyword_opportunities: List[Dict[str, str]] = []
    content_opportunities: List[Dict[str, str]] = []
    backlink_opportunities: List[Dict[str, str]] = []
    overall_competitive_score: Optional[float] = None
    generated_at: datetime
