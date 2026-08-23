import os

from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from apscheduler.triggers.interval import IntervalTrigger
from pymongo import MongoClient

from app.jobs.appointment_reminder import run_appointment_reminders
from app.jobs.medication_reminder import run_medication_reminders
from app.jobs.email_job import run_retry_failed_emails


# Load environment variables from .env
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.environ["MONGODB_URI"]
DB_NAME = os.getenv("DB_NAME", "healthcare_db")


# Create scheduler
scheduler = AsyncIOScheduler()


def init_scheduler():
    try:
        # Use synchronous PyMongo client for APScheduler JobStore
        sync_client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000
        )

        jobstore = MongoDBJobStore(
            client=sync_client,
            database=DB_NAME,
            collection="apscheduler_jobs"
        )

        scheduler.add_jobstore(jobstore, "default")

    except Exception as e:
        print(
            f"[Scheduler Warning] Could not connect "
            f"MongoDBJobStore ({e}), falling back to "
            f"in-memory store."
        )

    # 1. Appointment reminders - every hour
    if not scheduler.get_job("appointment_reminders"):
        scheduler.add_job(
            run_appointment_reminders,
            trigger=IntervalTrigger(hours=1),
            id="appointment_reminders",
            replace_existing=True,
            max_instances=1
        )

    # 2. Medication reminders - every hour
    if not scheduler.get_job("medication_reminders"):
        scheduler.add_job(
            run_medication_reminders,
            trigger=IntervalTrigger(hours=1),
            id="medication_reminders",
            replace_existing=True,
            max_instances=1
        )

    # 3. Retry failed emails - every 30 minutes
    if not scheduler.get_job("retry_failed_emails"):
        scheduler.add_job(
            run_retry_failed_emails,
            trigger=IntervalTrigger(minutes=30),
            id="retry_failed_emails",
            replace_existing=True,
            max_instances=1
        )

    # Start scheduler
    if not scheduler.running:
        scheduler.start()
        print(
            "[Scheduler] APScheduler background jobs "
            "initialized and running."
        )