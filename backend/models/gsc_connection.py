from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from core.types import GUID
import uuid
from datetime import datetime

from core.database import Base


class GoogleSearchConsoleConnection(Base):
    __tablename__ = "gsc_connections"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID(), ForeignKey("clients.id"), nullable=False, unique=True)
    site_url = Column(String(500), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    connected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="gsc_connection")
