import os
from pathlib import Path

# Base directory setup
BASE_DIR = Path(r"C:\Users\rahul\Downloads\Healthcare Appointment")

FILES = {
    # -------------------------------------------------------------
    # FRONTEND CONFIGURATION FILES
    # -------------------------------------------------------------
    "frontend/package.json": """{
  "name": "healthcare-frontend",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "~5.4.2"
  }
}""",

    "frontend/angular.json": """{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "healthcare-frontend": {
      "projectType": "application",
      "schematics": {
        "@angular/schematics:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/healthcare-frontend",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.json",
            "inlineStyleLanguage": "scss",
            "assets": [],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "buildTarget": "healthcare-frontend:build"
          }
        }
      }
    }
  }
}""",

    "frontend/tsconfig.json": """{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}""",

    "frontend/src/index.html": """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Healthcare Platform</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body class="bg-gray-50">
  <app-root></app-root>
</body>
</html>""",

    "frontend/src/main.ts": """import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));""",

    "frontend/src/styles.scss": """@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";""",

    # -------------------------------------------------------------
    # BACKEND MAIN & CONFIG
    # -------------------------------------------------------------
    "backend/app/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/healthcare_db"
    DB_NAME: str = "healthcare_db"
    JWT_SECRET: str = "super-secret-key-change-this-in-production-123456"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    GROQ_API_KEY: str = "gsk_placeholder"
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GMAIL_USER: str = "notifications@example.com"
    GMAIL_APP_PASSWORD: str = "xxxx-xxxx-xxxx-xxxx"
    FRONTEND_URL: str = "http://localhost:4200"

    class Config:
        env_file = ".env"

settings = Settings()""",

    "backend/app/main.py": """from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold
from app.models.notification import Notification
from app.jobs.scheduler import init_scheduler, scheduler
from app.routers import auth, patient, doctor, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[
            User,
            DoctorProfile,
            DoctorLeave,
            SlotHold,
            Appointment,
            Notification
        ]
    )
    init_scheduler(client)
    yield
    scheduler.shutdown()

app = FastAPI(title="Healthcare Platform API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(patient.router, prefix="/api/patients", tags=["Patient"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctor"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])""",

    # -------------------------------------------------------------
    # BACKEND MODELS
    # -------------------------------------------------------------
    "backend/app/models/user.py": """from datetime import datetime
from enum import Enum
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field, EmailStr

class Role(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class User(Document):
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    full_name: str
    role: Role = Role.PATIENT
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users" """,

    "backend/app/models/doctor_profile.py": """from datetime import date, time
from typing import Optional, List
from beanie import Document, Indexed, Link
from pydantic import BaseModel
import pymongo
from app.models.user import User

class WorkingHours(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time

class DoctorProfile(Document):
    user: Link[User]
    specialisation: Indexed(str)
    bio: Optional[str] = None
    slot_duration_minutes: int = 30
    working_hours: List[WorkingHours] = []
    is_active: bool = True

    class Settings:
        name = "doctor_profiles"

class DoctorLeave(Document):
    doctor_id: Indexed(str)
    leave_date: Indexed(date)
    reason: Optional[str] = None

    class Settings:
        name = "doctor_leaves"
        indexes = [
            pymongo.IndexModel([("doctor_id", pymongo.ASCENDING), ("leave_date", pymongo.ASCENDING)], unique=True)
        ]""",

    "backend/app/models/appointment.py": """from datetime import datetime
from enum import Enum
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field
import pymongo

class AppointmentStatus(str, Enum):
    HELD = "HELD"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class UrgencyLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class SlotHold(Document):
    doctor_id: str
    patient_id: str
    start_time: datetime
    expires_at: Indexed(datetime, expireAfterSeconds=0)

    class Settings:
        name = "slot_holds"
        indexes = [
            pymongo.IndexModel([("doctor_id", pymongo.ASCENDING), ("start_time", pymongo.ASCENDING)], unique=True)
        ]

class PreVisitSummary(BaseModel):
    urgency_level: UrgencyLevel
    chief_complaint: str
    suggested_questions: List[str]

class PrescriptionItem(BaseModel):
    medicine: str
    dosage: str
    frequency: str
    duration_days: int

class Appointment(Document):
    doctor_id: Indexed(str)
    patient_id: Indexed(str)
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus = AppointmentStatus.CONFIRMED
    symptoms: str
    pre_visit_summary: Optional[PreVisitSummary] = None
    pre_visit_llm_failed: bool = False
    clinical_notes: Optional[str] = None
    post_visit_summary: Optional[str] = None
    post_visit_llm_failed: bool = False
    prescriptions: List[PrescriptionItem] = []
    version: int = 1
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "appointments"
        indexes = [
            pymongo.IndexModel(
                [("doctor_id", pymongo.ASCENDING), ("start_time", pymongo.ASCENDING)],
                unique=True,
                partialFilterExpression={"status": {"$ne": "CANCELLED"}}
            )
        ]""",

    "backend/app/models/notification.py": """from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Notification(Document):
    recipient_email: str
    subject: str
    body_html: str
    status: str = "PENDING"
    retry_count: int = 0
    max_retries: int = 5
    last_error: Optional[str] = None
    scheduled_for: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications" """,

    # -------------------------------------------------------------
    # JOBS & SCHEDULER
    # -------------------------------------------------------------
    "backend/app/jobs/scheduler.py": """from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

scheduler = AsyncIOScheduler()

def init_scheduler(motor_client: AsyncIOMotorClient):
    jobstore = MongoDBJobStore(
        client=motor_client.get_default_database().client,
        database=settings.DB_NAME,
        collection="apscheduler_jobs"
    )
    scheduler.add_jobstore(jobstore)
    scheduler.start()""",

    # -------------------------------------------------------------
    # MIDDLEWARE
    # -------------------------------------------------------------
    "backend/app/middleware/auth.py": """from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.models.user import User, Role

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await User.get(user_id)
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: list[Role]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for current user role"
            )
        return current_user
    return role_checker""",

    # -------------------------------------------------------------
    # SERVICES
    # -------------------------------------------------------------
    "backend/app/services/llm_service.py": """import json
import asyncio
from groq import AsyncGroq
from app.config import settings
from app.models.appointment import PreVisitSummary, UrgencyLevel

async def generate_pre_visit_summary(symptoms: str) -> tuple[PreVisitSummary, bool]:
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "gsk_placeholder":
        return PreVisitSummary(
            urgency_level=UrgencyLevel.LOW,
            chief_complaint=symptoms[:100],
            suggested_questions=["Duration of symptoms?", "Any prior history?", "Severity scale 1-10?"]
        ), True

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    prompt = f"Analyse patient symptoms: '{symptoms}'. Return JSON with fields: urgency_level ('Low'|'Medium'|'High'), chief_complaint (str), suggested_questions (list of 3 str)."
    
    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return PreVisitSummary(**data), False
    except Exception:
        return PreVisitSummary(
            urgency_level=UrgencyLevel.MEDIUM,
            chief_complaint=symptoms[:100],
            suggested_questions=["Duration of symptoms?", "Any prior history?", "Severity scale 1-10?"]
        ), True

async def generate_post_visit_summary(notes: str) -> tuple[str, bool]:
    return f"Summary of clinical visit: {notes}", False""",

    # -------------------------------------------------------------
    # ROUTERS
    # -------------------------------------------------------------
    "backend/app/routers/auth.py": """from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

from app.config import settings
from app.models.user import User, Role
from app.middleware.auth import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role

@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email registered")
    user = User(email=payload.email, password_hash=pwd_context.hash(payload.password), full_name=payload.full_name, role=Role.PATIENT)
    await user.insert()
    token = jwt.encode({"sub": str(user.id), "role": user.role, "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(access_token=token, role=user.role)

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await User.find_one(User.email == payload.email)
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": str(user.id), "role": user.role, "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(access_token=token, role=user.role)

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role}""",

    "backend/app/routers/patient.py": """from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel

from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold, AppointmentStatus
from app.middleware.auth import require_role
from app.services.llm_service import generate_pre_visit_summary

router = APIRouter()

class HoldSlotRequest(BaseModel):
    doctor_id: str
    start_time: datetime

class BookAppointmentRequest(BaseModel):
    doctor_id: str
    start_time: datetime
    symptoms: str

@router.get("/doctors")
async def list_doctors():
    profiles = await DoctorProfile.find(DoctorProfile.is_active == True).to_list()
    res = []
    for p in profiles:
        doc = await User.get(p.user.ref.id)
        res.append({"id": str(p.id), "full_name": doc.full_name if doc else "Doctor", "specialisation": p.specialisation})
    return res

@router.get("/doctors/{doctor_id}/slots")
async def get_slots(doctor_id: str, date_val: date = Query(..., alias="date")):
    on_leave = await DoctorLeave.find_one(DoctorLeave.doctor_id == doctor_id, DoctorLeave.leave_date == date_val)
    if on_leave:
        return []
    profile = await DoctorProfile.get(doctor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    slots = []
    curr = datetime.combine(date_val, datetime.min.time().replace(hour=9))
    end = datetime.combine(date_val, datetime.min.time().replace(hour=17))
    delta = timedelta(minutes=profile.slot_duration_minutes)
    
    while curr + delta <= end:
        slots.append(curr)
        curr += delta

    booked = await Appointment.find(Appointment.doctor_id == doctor_id, Appointment.status != AppointmentStatus.CANCELLED).to_list()
    booked_times = {a.start_time for a in booked}
    return [{"start_time": s.isoformat()} for s in slots if s not in booked_times]

@router.post("/slots/hold")
async def hold_slot(payload: HoldSlotRequest, user: User = Depends(require_role([Role.PATIENT]))):
    try:
        hold = SlotHold(doctor_id=payload.doctor_id, patient_id=str(user.id), start_time=payload.start_time, expires_at=datetime.utcnow() + timedelta(minutes=5))
        await hold.insert()
        return {"hold_id": str(hold.id)}
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Slot temporarily held")

@router.post("/appointments")
async def book_appointment(payload: BookAppointmentRequest, user: User = Depends(require_role([Role.PATIENT]))):
    summary, failed = await generate_pre_visit_summary(payload.symptoms)
    try:
        appt = Appointment(
            doctor_id=payload.doctor_id,
            patient_id=str(user.id),
            start_time=payload.start_time,
            end_time=payload.start_time + timedelta(minutes=30),
            symptoms=payload.symptoms,
            pre_visit_summary=summary,
            pre_visit_llm_failed=failed
        )
        await appt.insert()
        return {"id": str(appt.id), "status": appt.status}
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Slot already booked")""",

    "backend/app/routers/doctor.py": """from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment
from app.middleware.auth import require_role

router = APIRouter()

@router.get("/dashboard")
async def doctor_dashboard(user: User = Depends(require_role([Role.DOCTOR]))):
    profile = await DoctorProfile.find_one(DoctorProfile.user.id == user.id)
    if not profile:
        return []
    return await Appointment.find(Appointment.doctor_id == str(profile.id)).to_list()""",

    "backend/app/routers/admin.py": """from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile
from app.middleware.auth import require_role
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class CreateDoctorRequest(BaseModel):
    email: str
    password: str
    full_name: str
    specialisation: str

@router.post("/doctors")
async def create_doctor(payload: CreateDoctorRequest, admin: User = Depends(require_role([Role.ADMIN]))):
    user = User(email=payload.email, password_hash=pwd_context.hash(payload.password), full_name=payload.full_name, role=Role.DOCTOR)
    await user.insert()
    profile = DoctorProfile(user=user, specialisation=payload.specialisation)
    await profile.insert()
    return {"doctor_id": str(profile.id)}""",

    # -------------------------------------------------------------
    # FRONTEND ANGULAR APP MODULES
    # -------------------------------------------------------------
    "frontend/src/app/app.routes.ts": """import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];""",

    "frontend/src/app/app.config.ts": """import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};""",

    "frontend/src/app/app.component.ts": """import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<div class="min-h-screen bg-gray-100 p-4"><router-outlet></router-outlet></div>`
})
export class AppComponent {}""",

    "frontend/src/app/core/interceptors/auth.interceptor.ts": """import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(cloned);
  }
  return next(req);
};"""
}

# Auto-create empty __init__.py files for Python package resolution
INIT_DIRS = [
    "backend/app",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/routers",
    "backend/app/services",
    "backend/app/jobs",
    "backend/app/middleware",
    "backend/app/utils"
]

def build():
    print("🛠 Writing full system source code to disk...")
    for init_dir in INIT_DIRS:
        p = BASE_DIR / init_dir
        p.mkdir(parents=True, exist_ok=True)
        init_file = p / "__init__.py"
        if not init_file.exists():
            init_file.touch()

    for relative_path, content in FILES.items():
        full_path = BASE_DIR / relative_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"  ✓ Written: {relative_path}")

    print("\n Success! All project code is in place.")

if __name__ == "__main__":
    build()