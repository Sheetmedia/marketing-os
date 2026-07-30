import uuid
from datetime import datetime


def model_to_dict(obj) -> dict:
    """Convert SQLAlchemy model to dict, handling UUID and datetime serialization."""
    if obj is None:
        return None
    result = {}
    for col in obj.__table__.columns:
        value = getattr(obj, col.name)
        if isinstance(value, uuid.UUID):
            value = str(value)
        elif isinstance(value, datetime):
            value = value.isoformat()
        result[col.name] = value
    return result
