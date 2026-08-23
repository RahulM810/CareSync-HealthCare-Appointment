from datetime import datetime
from enum import Enum
from typing import Optional, List, Annotated
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
    expires_at: Annotated[datetime, Indexed(expireAfterSeconds=0)]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "slot_holds"
        indexes = [
            pymongo.IndexModel([("doctor_id", pymongo.ASCENDING), ("start_time", pymongo.ASCENDING)], unique=True)
        ]

class PreVisitSummary(BaseModel):
    urgency_level: UrgencyLevel = UrgencyLevel.LOW
    chief_complaint: str
    suggested_questions: List[str] = []

class PrescriptionItem(BaseModel):
    medicine: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str] = "Take with water after food"

class Appointment(Document):
    doctor_id: Annotated[str, Indexed()]
    patient_id: Annotated[str, Indexed()]
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
    google_event_id: Optional[str] = None
    google_calendar_synced: bool = False
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "appointments"
        indexes = [
            pymongo.IndexModel(
                [("doctor_id", pymongo.ASCENDING), ("start_time", pymongo.ASCENDING)],
                unique=True,
                partialFilterExpression={"status": {"$in": ["HELD", "CONFIRMED", "COMPLETED"]}}
            )
        ]