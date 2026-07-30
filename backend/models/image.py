from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class GeneratedImage(Base):
    __tablename__ = "generated_images"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    width = Column(Integer, default=1024)
    height = Column(Integer, default=1024)
    format = Column(String(20), default="png")
    file_size = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)
    style = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)
    usage_type = Column(String(50), nullable=True)
    is_public = Column(Boolean, default=False)
    generated_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="generated_images")
