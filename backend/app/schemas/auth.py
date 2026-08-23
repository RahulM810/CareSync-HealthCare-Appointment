from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import Role

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    user_id: str
    email: str
    full_name: str
    google_calendar_connected: bool = False

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: Role
    phone_number: Optional[str] = None
    google_calendar_connected: bool = False
