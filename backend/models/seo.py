from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class SEOAudit(Base):
    __tablename__ = "seo_audits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    audit_type = Column(String(50), nullable=False)
    overall_score = Column(Float, nullable=True)
    performance_score = Column(Float, nullable=True)
    accessibility_score = Column(Float, nullable=True)
    best_practices_score = Column(Float, nullable=True)
    seo_score = Column(Float, nullable=True)
    results = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="seo_audits")
    technical_issues = relationship("TechnicalSEOIssue", back_populates="audit")


class SEOMetrics(Base):
    __tablename__ = "seo_metrics"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    organic_traffic = Column(Integer, default=0)
    organic_keywords = Column(Integer, default=0)
    domain_authority = Column(Float, default=0.0)
    page_authority = Column(Float, default=0.0)
    backlinks_count = Column(Integer, default=0)
    referring_domains = Column(Integer, default=0)
    avg_position = Column(Float, nullable=True)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    bounce_rate = Column(Float, nullable=True)
    avg_session_duration = Column(Float, nullable=True)
    pages_per_session = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="seo_metrics")


class TechnicalSEOIssue(Base):
    __tablename__ = "technical_seo_issues"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    audit_id = Column(GUID(), ForeignKey("seo_audits.id"), nullable=False)
    issue_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="medium")
    page_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit = relationship("SEOAudit", back_populates="technical_issues")
