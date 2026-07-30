from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ChatRequest(BaseModel):
    client_id: Optional[UUID] = Field(None, description="Client ID for context")
    message: str = Field(..., min_length=1, description="User message")
    conversation_id: Optional[UUID] = Field(None, description="Existing conversation ID")
    context: Optional[Dict[str, str]] = Field(None, description="Additional context")


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    message: str
    role: str
    suggestions: List[str] = []
    references: List[Dict[str, str]] = []
    created_at: datetime


class AnalyzeRequest(BaseModel):
    client_id: UUID = Field(..., description="Client ID")
    analysis_type: str = Field(..., description="Type of analysis: seo, content, competitor, performance")
    url: Optional[str] = Field(None, description="URL to analyze")
    parameters: Optional[Dict[str, str]] = Field(None, description="Additional analysis parameters")


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    category: str
    priority: str
    title: str
    description: str
    impact: Optional[str] = None
    effort: Optional[str] = None
    steps: List[str] = []
    related_metrics: Optional[Dict[str, float]] = None
    is_implemented: bool = False
    created_at: datetime
