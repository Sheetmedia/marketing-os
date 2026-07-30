from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    title = Column(String(500), nullable=False)
    report_type = Column(String(50), nullable=False, default="seo")
    description = Column(Text, nullable=True)
    date_range_start = Column(DateTime, nullable=True)
    date_range_end = Column(DateTime, nullable=True)
    data = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    file_url = Column(String(500), nullable=True)
    format = Column(String(20), default="pdf")
    status = Column(String(50), default="draft")
    generated_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    is_automated = Column(Boolean, default=False)
    schedule = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="reports")
