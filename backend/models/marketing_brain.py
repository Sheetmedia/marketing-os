from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON
from core.types import GUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class MarketingStrategy(Base):
    __tablename__ = "marketing_strategies"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False)
    situation_summary = Column(Text, nullable=True)
    diagnosed_issues = Column(JSON, nullable=True)
    opportunities = Column(JSON, nullable=True)
    channel_recommendations = Column(JSON, nullable=True)
    budget_allocation = Column(JSON, nullable=True)
    kpi_forecast = Column(JSON, nullable=True)
    snapshot = Column(JSON, nullable=True)
    ai_model_used = Column(String(100), nullable=True)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="marketing_strategies")
