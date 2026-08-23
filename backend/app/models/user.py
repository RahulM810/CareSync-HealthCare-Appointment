from enum import Enum
from typing import Optional, Annotated
from datetime import datetime
from beanie import Document, Indexed
from pydantic import EmailStr, Field

class Role(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class User(Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    password_hash: str
    full_name: str
    role: Role = Role.PATIENT
    phone_number: Optional[str] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_calendar_connected: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"