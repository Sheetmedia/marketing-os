from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class CampaignCreate(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    name: str = Field(..., min_length=1, max_length=255, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    campaign_type: str = Field("seo", description="Campaign type: seo, content, social, ads")
    goals: Optional[Dict[str, str]] = Field(None, description="Campaign goals")
    budget: Optional[float] = Field(None, ge=0, description="Campaign budget")
    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    status: Optional[str] = Field(None, description="Campaign status")
    goals: Optional[Dict[str, str]] = Field(None, description="Campaign goals")
    budget: Optional[float] = Field(None, ge=0, description="Campaign budget")
    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    name: str
    description: Optional[str] = None
    campaign_type: str
    status: str = "draft"
    goals: Optional[Dict[str, str]] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    brief: Optional[str] = Field(None, description="AI-generated creative brief")
    audience_segments: Optional[List[dict]] = Field(None, description="AI-generated audience segments")
    budget_allocation: Optional[Dict[str, int]] = Field(None, description="AI-recommended per-channel budget split (%)")
    ai_model_used: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class CampaignMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    campaign_id: UUID
    total_tasks: int = 0
    completed_tasks: int = 0
    organic_traffic_change: Optional[float] = None
    keyword_rankings_improved: Optional[int] = None
    backlinks_acquired: Optional[int] = None
    content_pieces_created: Optional[int] = None
    conversion_rate: Optional[float] = None
    roi: Optional[float] = None
    collected_at: datetime
