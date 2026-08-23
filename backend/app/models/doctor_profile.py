from typing import Optional, List, Dict
from datetime import date, datetime
from beanie import Document, Link, Indexed
from pydantic import BaseModel, Field
from app.models.user import User

class WorkingHours(BaseModel):
    # day_of_week: 0 = Monday, 6 = Sunday
    day_of_week: int
    start_hour: int = 9  # 9 AM
    end_hour: int = 17   # 5 PM
    is_working: bool = True

class DoctorProfile(Document):
    user: Link[User]
    specialisation: str
    bio: Optional[str] = "Dedicated medical professional focused on comprehensive patient care."
    consultation_fee: float = 50.0
    slot_duration_minutes: int = 30
    room_number: Optional[str] = "Room 101"
    is_active: bool = True
    working_hours: List[WorkingHours] = [
        WorkingHours(day_of_week=0, start_hour=9, end_hour=17, is_working=True),
        WorkingHours(day_of_week=1, start_hour=9, end_hour=17, is_working=True),
        WorkingHours(day_of_week=2, start_hour=9, end_hour=17, is_working=True),
        WorkingHours(day_of_week=3, start_hour=9, end_hour=17, is_working=True),
        WorkingHours(day_of_week=4, start_hour=9, end_hour=17, is_working=True),
        WorkingHours(day_of_week=5, start_hour=10, end_hour=14, is_working=False),
        WorkingHours(day_of_week=6, start_hour=10, end_hour=14, is_working=False),
    ]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "doctor_profiles"

class DoctorLeave(Document):
    doctor_id: str
    leave_date: date
    reason: Optional[str] = None
    affected_appointments: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "doctor_leaves"