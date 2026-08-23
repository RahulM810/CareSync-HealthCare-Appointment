from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from pymongo import MongoClient

from app.config import settings
from app.jobs.appointment_reminder import run_appointment_reminders
from app.jobs.medication_reminder import run_medication_reminders
from app.jobs.email_job import run_retry_failed_emails

scheduler = AsyncIOScheduler()

def init_scheduler():
    try:
        # Use sync pymongo client for APScheduler JobStore
        sync_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        jobstore = MongoDBJobStore(
            client=sync_client,
            database=settings.DB_NAME,
            collection="apscheduler_jobs"
        )
        scheduler.add_jobstore(jobstore, "default")
    except Exception as e:
        print(f"[Scheduler Warning] Could not connect MongoDBJobStore ({e}), falling back to in-memory store.")

    # 1. 24-hour appointment reminder (every hour)
    if not scheduler.get_job("appointment_reminders"):
        scheduler.add_job(
            run_appointment_reminders,
            trigger=IntervalTrigger(hours=1),
            id="appointment_reminders",
            replace_existing=True,
            max_instances=1
        )

    # 2. Daily medication reminder (every hour)
    if not scheduler.get_job("medication_reminders"):
        scheduler.add_job(
            run_medication_reminders,
            trigger=IntervalTrigger(hours=1),
            id="medication_reminders",
            replace_existing=True,
            max_instances=1
        )

    # 3. Retry failed emails (every 30 minutes)
    if not scheduler.get_job("retry_failed_emails"):
        scheduler.add_job(
            run_retry_failed_emails,
            trigger=IntervalTrigger(minutes=30),
            id="retry_failed_emails",
            replace_existing=True,
            max_instances=1
        )

    if not scheduler.running:
        scheduler.start()
        print("[Scheduler] APScheduler background jobs initialized and running.")