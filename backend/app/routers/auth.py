import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse

from app.models.user import User, Role
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserProfileResponse
)
from app.services.auth_service import auth_service
from app.middleware.auth import get_current_user


# Load environment variables
load_dotenv()

# Frontend URL
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:4200"
)


router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    existing = await User.find_one(User.email == payload.email)

    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    hashed_pw = auth_service.hash_password(payload.password)

    user = User(
        email=payload.email,
        password_hash=hashed_pw,
        full_name=payload.full_name,
        role=Role.PATIENT,
        phone_number=payload.phone_number
    )

    await user.insert()

    token = auth_service.create_jwt(
        str(user.id),
        user.role,
        user.email
    )

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        google_calendar_connected=user.google_calendar_connected
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await User.find_one(User.email == payload.email)

    if not user or not auth_service.verify_password(
        payload.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = auth_service.create_jwt(
        str(user.id),
        user.role,
        user.email
    )

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        google_calendar_connected=user.google_calendar_connected
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone_number=current_user.phone_number,
        google_calendar_connected=current_user.google_calendar_connected
    )


@router.get("/google")
async def google_auth_redirect():
    url = auth_service.get_google_auth_url()

    return {
        "auth_url": url
    }


@router.get("/google/callback")
async def google_auth_callback(
    code: str = Query(...)
):
    token_data = await auth_service.exchange_google_code_for_tokens(code)

    if not token_data or "user_info" not in token_data:

        # Redirect back to frontend login with error
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=oauth_failed"
        )

    user_info = token_data["user_info"]

    email = user_info.get("email")
    name = user_info.get("name", "Google User")

    user = await User.find_one(User.email == email)

    # Create a new user if one does not exist
    if not user:
        user = User(
            email=email,
            password_hash=auth_service.hash_password(
                "google_oauth_default_pwd"
            ),
            full_name=name,
            role=Role.PATIENT,
            google_access_token=token_data.get("access_token"),
            google_refresh_token=token_data.get("refresh_token"),
            google_calendar_connected=True
        )

        await user.insert()

    else:
        # Update existing user's Google tokens
        user.google_access_token = token_data.get("access_token")

        if token_data.get("refresh_token"):
            user.google_refresh_token = token_data.get("refresh_token")

        user.google_calendar_connected = True

        await user.save()

    # Create JWT token
    jwt_token = auth_service.create_jwt(
        str(user.id),
        user.role,
        user.email
    )

    return RedirectResponse(
        url=(
            f"{FRONTEND_URL}/login"
            f"?token={jwt_token}"
            f"&role={user.role.value}"
        )
    )