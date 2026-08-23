import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from jose import jwt
import httpx
from app.config import settings
from app.models.user import User, Role

class AuthService:
    @staticmethod
    def hash_password(plain_password: str) -> str:
        # bcrypt has 72 byte limit, truncate or encode to bytes
        pwd_bytes = plain_password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            pwd_bytes = plain_password.encode("utf-8")[:72]
            hash_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(pwd_bytes, hash_bytes)
        except Exception:
            return False

    @staticmethod
    def create_jwt(user_id: str, role: Role, email: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "role": role.value if isinstance(role, Role) else str(role),
            "email": email,
            "exp": int((now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)).timestamp()),
            "iat": int(now.timestamp())
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            return None

    @staticmethod
    def get_google_auth_url(state: Optional[str] = None) -> str:
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID or "",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/calendar.events",
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"

    @staticmethod
    async def exchange_google_code_for_tokens(code: str) -> Optional[Dict[str, Any]]:
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(token_url, data=payload, timeout=10.0)
                if response.status_code == 200:
                    tokens = response.json()
                    userinfo_resp = await client.get(
                        "https://www.googleapis.com/oauth2/v2/userinfo",
                        headers={"Authorization": f"Bearer {tokens['access_token']}"}
                    )
                    if userinfo_resp.status_code == 200:
                        user_info = userinfo_resp.json()
                        return {**tokens, "user_info": user_info}
            except Exception as e:
                print(f"Error in Google OAuth exchange: {e}")
        return None

auth_service = AuthService()
