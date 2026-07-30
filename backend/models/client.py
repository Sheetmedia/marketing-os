from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agency_id = Column(GUID(), ForeignKey("agencies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    industry = Column(String(100), nullable=True)
    brand_colors = Column(JSON, nullable=True)
    brand_fonts = Column(JSON, nullable=True)
    keywords = Column(JSON, nullable=True)
    competitors = Column(JSON, nullable=True)
    marketing_goals = Column(Text, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agency = relationship("Agency", back_populates="clients")
    seo_audits = relationship("SEOAudit", back_populates="client")
    seo_metrics = relationship("SEOMetrics", back_populates="client")
    keywords_list = relationship("Keyword", back_populates="client")
    backlink_profile = relationship("BacklinkProfile", back_populates="client")
    contents = relationship("Content", back_populates="client")
    campaigns = relationship("Campaign", back_populates="client")
    social_accounts = relationship("SocialAccount", back_populates="client")
    ad_accounts = relationship("AdAccount", back_populates="client")
    reports = relationship("Report", back_populates="client")
    alerts = relationship("Alert", back_populates="client")
    competitor_analyses = relationship("CompetitorAnalysis", back_populates="client")
    generated_images = relationship("GeneratedImage", back_populates="client")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="client")
    marketing_strategies = relationship("MarketingStrategy", back_populates="client")
    gsc_connection = relationship("GoogleSearchConsoleConnection", back_populates="client", uselist=False)
