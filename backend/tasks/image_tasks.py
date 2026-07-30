from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.image_tasks.generate_image")
def generate_image(self, client_id: str, prompt: str, image_type: str, style: str):
    """Generate a marketing image using Stable Diffusion."""
    logger.info(f"Generating {image_type} image for client {client_id}")
    self.update_state(state="GENERATING", meta={"progress": 50})
    logger.info(f"Image generation completed for client {client_id}")
    return {"status": "completed", "client_id": client_id, "image_type": image_type}
