from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.appointment import AppointmentStatus, UrgencyLevel, PreVisitSummary, PrescriptionItem

class HoldSlotRequest(BaseModel):
    doctor_id: str
    start_time: datetime

class HoldSlotResponse(BaseModel):
    hold_id: str
    doctor_id: str
    start_time: datetime
    expires_at: datetime
    message: str = "Slot held for 5 minutes"

class BookAppointmentRequest(BaseModel):
    doctor_id: str
    start_time: datetime
    symptoms: str

class RescheduleAppointmentRequest(BaseModel):
    new_start_time: datetime

class SubmitClinicalNotesRequest(BaseModel):
    clinical_notes: str
    prescriptions: List[PrescriptionItem] = []

class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    doctor_specialisation: Optional[str] = None
    patient_id: str
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus
    symptoms: str
    pre_visit_summary: Optional[PreVisitSummary] = None
    pre_visit_llm_failed: bool = False
    clinical_notes: Optional[str] = None
    post_visit_summary: Optional[str] = None
    post_visit_llm_failed: bool = False
    prescriptions: List[PrescriptionItem] = []
    google_calendar_synced: bool = False
    created_at: datetime
    updated_at: datetime

class SlotItem(BaseModel):
    start_time: datetime
    end_time: datetime
    is_available: bool = True
