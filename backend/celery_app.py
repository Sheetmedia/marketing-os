from celery import Celery
from core.config import settings

celery_app = Celery(
    "marketing_os",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "tasks.seo_tasks",
        "tasks.content_tasks",
        "tasks.image_tasks",
        "tasks.report_tasks",
        "tasks.social_tasks",
        "tasks.ads_tasks",
        "tasks.alert_tasks",
        "tasks.autopilot_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "tasks.seo_tasks.*": {"queue": "seo"},
        "tasks.content_tasks.*": {"queue": "content"},
        "tasks.image_tasks.*": {"queue": "images"},
        "tasks.report_tasks.*": {"queue": "reports"},
        "tasks.social_tasks.*": {"queue": "social"},
        "tasks.ads_tasks.*": {"queue": "ads"},
        "tasks.alert_tasks.*": {"queue": "alerts"},
        "tasks.autopilot_tasks.*": {"queue": "autopilot"},
    },
    beat_schedule={
        "check-keyword-rankings": {
            "task": "tasks.seo_tasks.update_keyword_rankings",
            "schedule": 3600.0,  # every hour
        },
        "check-backlink-status": {
            "task": "tasks.seo_tasks.check_backlinks",
            "schedule": 86400.0,  # daily
        },
        "run-alert-checks": {
            "task": "tasks.alert_tasks.run_monitoring",
            "schedule": 1800.0,  # every 30 minutes
        },
        "sync-ad-accounts": {
            "task": "tasks.ads_tasks.sync_all_accounts",
            "schedule": 3600.0,  # every hour
        },
        "publish-scheduled-posts": {
            "task": "tasks.social_tasks.publish_scheduled",
            "schedule": 300.0,  # every 5 minutes
        },
        "run-autopilot-cycles": {
            "task": "tasks.autopilot_tasks.run_all_autopilots",
            "schedule": 86400.0,  # daily
        },
    },
)
