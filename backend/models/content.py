from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class Content(Base):
    __tablename__ = "contents"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=True)
    content_type = Column(String(50), nullable=False, default="blog_post")
    body = Column(Text, nullable=True)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(String(500), nullable=True)
    target_keyword = Column(String(255), nullable=True)
    secondary_keywords = Column(JSON, nullable=True)
    word_count = Column(Integer, default=0)
    readability_score = Column(Float, nullable=True)
    seo_score = Column(Float, nullable=True)
    tone = Column(String(50), nullable=True)
    language = Column(String(10), default="en")
    status = Column(String(50), default="draft")
    published_url = Column(String(500), nullable=True)
    published_at = Column(DateTime, nullable=True)
    ai_generated = Column(Boolean, default=False)
    ai_model_used = Column(String(100), nullable=True)
    generation_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="contents")
