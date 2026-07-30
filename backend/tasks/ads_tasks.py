from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.ads_tasks.sync_all_accounts")
def sync_all_accounts():
    """Sync data from all connected ad accounts."""
    logger.info("Syncing all ad accounts")
    return {"status": "completed"}


@celery_app.task(name="tasks.ads_tasks.sync_google_ads")
def sync_google_ads(account_id: str):
    """Sync Google Ads data."""
    logger.info(f"Syncing Google Ads account {account_id}")
    return {"status": "completed", "account_id": account_id}


@celery_app.task(name="tasks.ads_tasks.sync_facebook_ads")
def sync_facebook_ads(account_id: str):
    """Sync Facebook Ads data."""
    logger.info(f"Syncing Facebook Ads account {account_id}")
    return {"status": "completed", "account_id": account_id}
