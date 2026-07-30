from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class BacklinkProfile(Base):
    __tablename__ = "backlink_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    total_backlinks = Column(Integer, default=0)
    referring_domains = Column(Integer, default=0)
    domain_authority = Column(Float, default=0.0)
    spam_score = Column(Float, default=0.0)
    dofollow_count = Column(Integer, default=0)
    nofollow_count = Column(Integer, default=0)
    last_crawled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="backlink_profile")
    backlinks = relationship("Backlink", back_populates="profile")


class Backlink(Base):
    __tablename__ = "backlinks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    profile_id = Column(GUID(), ForeignKey("backlink_profiles.id"), nullable=False)
    source_url = Column(String(500), nullable=False)
    target_url = Column(String(500), nullable=False)
    anchor_text = Column(String(500), nullable=True)
    rel_type = Column(String(50), default="dofollow")
    domain_authority = Column(Float, default=0.0)
    page_authority = Column(Float, default=0.0)
    spam_score = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("BacklinkProfile", back_populates="backlinks")
