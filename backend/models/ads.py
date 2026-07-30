from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class AdAccount(Base):
    __tablename__ = "ad_accounts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    platform = Column(String(50), nullable=False)
    account_name = Column(String(255), nullable=True)
    account_id = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    currency = Column(String(10), default="USD")
    timezone = Column(String(50), nullable=True)
    is_connected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="ad_accounts")
    ad_campaigns = relationship("AdCampaign", back_populates="ad_account")


class AdCampaign(Base):
    __tablename__ = "ad_campaigns"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    ad_account_id = Column(GUID(), ForeignKey("ad_accounts.id"), nullable=False)
    platform_campaign_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    objective = Column(String(100), nullable=True)
    status = Column(String(50), default="draft")
    budget_type = Column(String(50), default="daily")
    budget_amount = Column(Float, default=0.0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    targeting = Column(JSON, nullable=True)
    ad_creatives = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ad_account = relationship("AdAccount", back_populates="ad_campaigns")
    metrics = relationship("AdMetrics", back_populates="ad_campaign")


class AdMetrics(Base):
    __tablename__ = "ad_metrics"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    ad_campaign_id = Column(GUID(), ForeignKey("ad_campaigns.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    spend = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)
    ctr = Column(Float, default=0.0)
    cpc = Column(Float, default=0.0)
    cpa = Column(Float, default=0.0)
    roas = Column(Float, default=0.0)
    quality_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ad_campaign = relationship("AdCampaign", back_populates="metrics")
