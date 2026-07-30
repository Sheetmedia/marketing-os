from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AdAccountCreate(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    platform: str = Field(..., description="Ad platform: google_ads, meta_ads, linkedin_ads")
    account_id: str = Field(..., description="External platform account ID")
    account_name: str = Field(..., min_length=1, max_length=255, description="Account name")
    access_token: Optional[str] = Field(None, description="Platform access token")


class AdAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    platform: str
    account_id: str
    account_name: str
    is_connected: bool = False
    currency: str = "USD"
    total_spend: Optional[float] = None
    connected_at: Optional[datetime] = None
    created_at: datetime


class AdCampaignCreate(BaseModel):
    ad_account_id: UUID = Field(..., description="Ad account ID")
    name: str = Field(..., min_length=1, max_length=255, description="Campaign name")
    campaign_type: str = Field("search", description="Campaign type")
    budget: float = Field(..., gt=0, description="Daily budget")
    target_audience: Optional[Dict[str, str]] = Field(None, description="Target audience settings")
    keywords: List[str] = Field(default_factory=list, description="Target keywords")
    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")


class AdCampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ad_account_id: UUID
    name: str
    campaign_type: str
    status: str = "draft"
    budget: float
    spent: Optional[float] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    conversions: Optional[int] = None
    ctr: Optional[float] = None
    cpc: Optional[float] = None
    roas: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class AdAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ad_account_id: UUID
    total_spend: float = 0.0
    total_impressions: int = 0
    total_clicks: int = 0
    total_conversions: int = 0
    average_ctr: Optional[float] = None
    average_cpc: Optional[float] = None
    average_roas: Optional[float] = None
    campaigns: List[AdCampaignResponse] = []
    period_start: datetime
    period_end: datetime
