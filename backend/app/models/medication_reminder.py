from datetime import datetime, date
from enum import Enum
from typing import Optional, Annotated
from beanie import Document, Indexed
from pydantic import Field

class ReminderStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"

class MedicationReminder(Document):
    appointment_id: Annotated[str, Indexed()]
    patient_id: Annotated[str, Indexed()]
    patient_email: str
    patient_name: str
    medicine: str
    dosage: str
    frequency: str
    start_date: date
    end_date: date
    last_sent_at: Optional[datetime] = None
    status: ReminderStatus = ReminderStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "medication_reminders"
