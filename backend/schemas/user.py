from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="User password")


class UserLogin(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    is_active: bool
    agency_id: Optional[UUID] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
