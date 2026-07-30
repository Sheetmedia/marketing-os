from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class BacklinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    source_url: str
    target_url: str
    anchor_text: Optional[str] = None
    domain_authority: Optional[float] = None
    is_dofollow: bool = True
    is_active: bool = True
    first_seen: Optional[datetime] = None
    last_checked: Optional[datetime] = None
    created_at: datetime


class BacklinkProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    client_id: UUID
    total_backlinks: int = 0
    dofollow_count: int = 0
    nofollow_count: int = 0
    referring_domains: int = 0
    domain_authority: Optional[float] = None
    backlinks: List[BacklinkResponse] = []
    analyzed_at: datetime
