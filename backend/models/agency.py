from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    logo_url = Column(String(500), nullable=True)
    subscription_plan = Column(String(50), default="free")
    max_clients = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="agency")
    clients = relationship("Client", back_populates="agency")
