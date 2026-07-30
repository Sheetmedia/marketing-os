from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON
from core.types import GUID
import uuid
from datetime import datetime
from core.database import Base


class BugReport(Base):
    __tablename__ = "bug_reports"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    module = Column(String(100), nullable=True)
    severity = Column(String(50), default="medium")  # critical, high, medium, low
    status = Column(String(50), default="open")  # open, in_progress, resolved, closed
    steps_to_reproduce = Column(Text, nullable=True)
    expected_behavior = Column(Text, nullable=True)
    actual_behavior = Column(Text, nullable=True)
    browser_info = Column(String(255), nullable=True)
    screenshot_url = Column(String(500), nullable=True)
    reported_by = Column(String(255), nullable=True)
    assigned_to = Column(String(255), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
