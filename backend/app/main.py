from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold
from app.models.medication_reminder import MedicationReminder
from app.models.notification import Notification
from app.jobs.scheduler import init_scheduler, scheduler
from app.routers import auth, patient, doctor, admin, calendar

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize MongoDB with Beanie ODM
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    database = client.get_database(settings.DB_NAME)
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            DoctorProfile,
            DoctorLeave,
            SlotHold,
            Appointment,
            MedicationReminder,
            Notification
        ]
    )
    print("[Lifespan] MongoDB & Beanie ODM models initialized successfully.")

    # 2. Initialize APScheduler background jobs
    init_scheduler()

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Lifespan] Scheduler shut down.")

app = FastAPI(
    title="Healthcare Appointment & Follow-up API",
    description="Full-stack healthcare platform API featuring Groq AI triage, Google Calendar sync, and Beanie ODM.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registrations
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(patient.router, prefix="/api/patients", tags=["Patient"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctor"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": settings.DB_NAME,
        "scheduler_running": scheduler.running
    }