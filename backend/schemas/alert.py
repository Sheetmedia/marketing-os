from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    alert_type: str
    severity: str
    title: str
    message: str
    is_read: bool = False
    is_resolved: bool = False
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None


class AlertSettingsUpdate(BaseModel):
    ranking_drop_threshold: Optional[int] = Field(None, ge=1, description="Alert on ranking drop of N positions")
    traffic_drop_percentage: Optional[float] = Field(None, ge=0, le=100, description="Alert on traffic drop percentage")
    backlink_lost_alert: Optional[bool] = Field(None, description="Alert on lost backlinks")
    uptime_alert: Optional[bool] = Field(None, description="Alert on site downtime")
    email_notifications: Optional[bool] = Field(None, description="Enable email notifications")
    slack_notifications: Optional[bool] = Field(None, description="Enable Slack notifications")
    notification_channels: Optional[List[str]] = Field(None, description="Notification channel list")
