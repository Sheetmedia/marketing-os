from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class KeywordGroup(Base):
    __tablename__ = "keyword_groups"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    keywords = relationship("Keyword", back_populates="group")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    group_id = Column(GUID(), ForeignKey("keyword_groups.id"), nullable=True)
    keyword = Column(String(500), nullable=False)
    search_volume = Column(Integer, default=0)
    difficulty = Column(Float, default=0.0)
    cpc = Column(Float, default=0.0)
    current_position = Column(Integer, nullable=True)
    previous_position = Column(Integer, nullable=True)
    target_url = Column(String(500), nullable=True)
    intent = Column(String(50), nullable=True)
    trend_data = Column(JSON, nullable=True)
    is_tracked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="keywords_list")
    group = relationship("KeywordGroup", back_populates="keywords")
