from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    platform = Column(String(50), nullable=False)
    account_name = Column(String(255), nullable=True)
    account_id = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    followers_count = Column(Integer, default=0)
    is_connected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="social_accounts")
    posts = relationship("SocialPost", back_populates="account")


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    account_id = Column(GUID(), ForeignKey("social_accounts.id"), nullable=False)
    content = Column(Text, nullable=True)
    media_urls = Column(JSON, nullable=True)
    hashtags = Column(JSON, nullable=True)
    post_type = Column(String(50), default="text")
    status = Column(String(50), default="draft")
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    platform_post_id = Column(String(255), nullable=True)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("SocialAccount", back_populates="posts")


class ContentCalendar(Base):
    __tablename__ = "content_calendar"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(50), nullable=False)
    platform = Column(String(50), nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="planned")
    assigned_to = Column(GUID(), ForeignKey("users.id"), nullable=True)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
