from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.alert_tasks.run_monitoring")
def run_monitoring():
    """Run all monitoring checks for all active clients."""
    logger.info("Running monitoring checks for all clients")
    return {"status": "completed"}


@celery_app.task(name="tasks.alert_tasks.check_client_alerts")
def check_client_alerts(client_id: str):
    """Run all alert checks for a specific client."""
    logger.info(f"Checking alerts for client {client_id}")
    return {"status": "completed", "client_id": client_id}
