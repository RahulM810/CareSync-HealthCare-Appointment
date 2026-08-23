import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.models.user import User
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold
from app.models.medication_reminder import MedicationReminder
from app.models.notification import Notification
from app.jobs.scheduler import init_scheduler, scheduler
from app.routers import auth, patient, doctor, admin, calendar


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

# Database
MONGODB_URI = os.environ["MONGODB_URI"]
DB_NAME = os.getenv("DB_NAME", "healthcare_db")

# Frontend
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:4200"
)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Initialize MongoDB
    client = AsyncIOMotorClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000
    )

    database = client.get_database(DB_NAME)

    # Initialize Beanie ODM
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

    print(
        "[Lifespan] MongoDB & Beanie ODM models "
        "initialized successfully."
    )

    # Initialize APScheduler
    init_scheduler()

    # Application runs here
    yield

    # Shutdown scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Lifespan] Scheduler shut down.")

    # Close MongoDB connection
    client.close()
    print("[Lifespan] MongoDB connection closed.")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Healthcare Appointment & Follow-up API",
    description=(
        "Full-stack healthcare platform API featuring "
        "Groq AI triage, Google Calendar sync, "
        "and Beanie ODM."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Auth"]
)

app.include_router(
    patient.router,
    prefix="/api/patients",
    tags=["Patient"]
)

app.include_router(
    doctor.router,
    prefix="/api/doctors",
    tags=["Doctor"]
)

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"]
)

app.include_router(
    calendar.router,
    prefix="/api/calendar",
    tags=["Calendar"]
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": DB_NAME,
        "scheduler_running": scheduler.running
    }