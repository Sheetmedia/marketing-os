from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analyses = relationship("CompetitorAnalysis", back_populates="competitor")


class CompetitorAnalysis(Base):
    __tablename__ = "competitor_analyses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    competitor_id = Column(GUID(), ForeignKey("competitors.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False, default="seo")
    domain_authority = Column(Float, nullable=True)
    organic_traffic = Column(Integer, nullable=True)
    organic_keywords = Column(Integer, nullable=True)
    backlinks_count = Column(Integer, nullable=True)
    referring_domains = Column(Integer, nullable=True)
    top_keywords = Column(JSON, nullable=True)
    content_gap = Column(JSON, nullable=True)
    backlink_gap = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="competitor_analyses")
    competitor = relationship("Competitor", back_populates="analyses")
