from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ReportGenerateRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    report_type: str = Field("monthly", description="Report type: weekly, monthly, quarterly, custom")
    sections: List[str] = Field(
        default_factory=lambda: ["overview", "seo", "keywords", "content", "backlinks"],
        description="Report sections to include",
    )
    start_date: Optional[datetime] = Field(None, description="Report period start")
    end_date: Optional[datetime] = Field(None, description="Report period end")
    format: str = Field("pdf", description="Output format: pdf, html, json")
    include_recommendations: bool = Field(True, description="Include AI recommendations")


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    report_type: str
    title: str
    file_url: Optional[str] = None
    format: str
    sections: List[str] = []
    summary: Optional[str] = None
    data: Optional[Dict[str, Dict]] = None
    status: str = "pending"
    created_at: datetime
    completed_at: Optional[datetime] = None
