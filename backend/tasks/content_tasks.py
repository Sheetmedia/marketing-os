from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.content_tasks.generate_content")
def generate_content(self, client_id: str, content_type: str, topic: str, keywords: list, tone: str, length: str):
    """Generate AI content for a client."""
    logger.info(f"Generating {content_type} content for client {client_id}")
    self.update_state(state="GENERATING", meta={"progress": 30})
    self.update_state(state="OPTIMIZING", meta={"progress": 70})
    logger.info(f"Content generation completed for client {client_id}")
    return {"status": "completed", "client_id": client_id, "content_type": content_type}


@celery_app.task(name="tasks.content_tasks.optimize_content")
def optimize_content(content_id: str, keywords: list):
    """Optimize existing content for SEO."""
    logger.info(f"Optimizing content {content_id}")
    return {"status": "completed", "content_id": content_id}
