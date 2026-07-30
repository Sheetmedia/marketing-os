from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class SEOAuditRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID to audit")
    url: str = Field(..., description="URL to audit")
    depth: int = Field(1, ge=1, le=10, description="Crawl depth")
    include_competitors: bool = Field(False, description="Include competitor analysis")


class TechnicalIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    audit_id: UUID
    issue_type: str
    severity: str
    url: str
    description: str
    recommendation: Optional[str] = None
    created_at: datetime


class SEOMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    url: str
    page_speed_score: Optional[float] = None
    mobile_score: Optional[float] = None
    domain_authority: Optional[float] = None
    organic_traffic: Optional[int] = None
    keyword_rankings: Optional[Dict[str, int]] = None
    backlink_count: Optional[int] = None
    indexed_pages: Optional[int] = None
    collected_at: datetime


class SEOAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    url: str
    overall_score: Optional[float] = None
    performance_score: Optional[float] = None
    accessibility_score: Optional[float] = None
    best_practices_score: Optional[float] = None
    seo_score: Optional[float] = None
    technical_issues: List[TechnicalIssueResponse] = []
    metrics: Optional[SEOMetricsResponse] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    status: str = "pending"
