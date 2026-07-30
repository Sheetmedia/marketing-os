from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Client name")
    website_url: str = Field(..., description="Client website URL")
    industry: Optional[str] = Field(None, max_length=100, description="Client industry")
    contact_email: Optional[str] = Field(None, description="Primary contact email")


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Client name")
    website_url: Optional[str] = Field(None, description="Client website URL")
    industry: Optional[str] = Field(None, max_length=100, description="Client industry")
    contact_email: Optional[str] = Field(None, description="Primary contact email")


class ClientResponse(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agency_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
