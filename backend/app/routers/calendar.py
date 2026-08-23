from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.auth_service import auth_service

router = APIRouter()

@router.get("/connect")
async def connect_google_calendar(current_user: User = Depends(get_current_user)):
    url = auth_service.get_google_auth_url(state=str(current_user.id))
    return {"oauth_url": url}

@router.get("/status")
async def get_calendar_status(current_user: User = Depends(get_current_user)):
    return {
        "connected": current_user.google_calendar_connected,
        "email": current_user.email
    }

@router.post("/disconnect")
async def disconnect_google_calendar(current_user: User = Depends(get_current_user)):
    current_user.google_access_token = None
    current_user.google_refresh_token = None
    current_user.google_calendar_connected = False
    await current_user.save()
    return {"message": "Google Calendar disconnected successfully", "connected": False}
