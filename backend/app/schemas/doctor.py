from typing import Optional, List
from datetime import date
from pydantic import BaseModel, EmailStr
from app.models.doctor_profile import WorkingHours

class CreateDoctorRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    specialisation: str
    bio: Optional[str] = "Experienced medical specialist dedicated to patient wellness."
    consultation_fee: float = 50.0
    slot_duration_minutes: int = 30
    room_number: Optional[str] = "Room 101"
    working_hours: Optional[List[WorkingHours]] = None

class UpdateDoctorRequest(BaseModel):
    full_name: Optional[str] = None
    specialisation: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    slot_duration_minutes: Optional[int] = None
    room_number: Optional[str] = None
    is_active: Optional[bool] = None
    working_hours: Optional[List[WorkingHours]] = None

class DoctorResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    specialisation: str
    bio: Optional[str] = None
    consultation_fee: float
    slot_duration_minutes: int
    room_number: Optional[str] = None
    is_active: bool
    working_hours: List[WorkingHours]
    next_available_slot: Optional[str] = None

class DoctorLeaveRequest(BaseModel):
    leave_date: date
    reason: Optional[str] = "Personal / Vacation"

class DoctorLeaveResponse(BaseModel):
    id: str
    doctor_id: str
    leave_date: date
    reason: Optional[str] = None
    affected_appointments: int
