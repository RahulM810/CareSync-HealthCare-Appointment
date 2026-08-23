import os
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from jose import jwt

from app.models.user import Role


# Load environment variables from .env
load_dotenv()

# JWT configuration
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
GOOGLE_REDIRECT_URI = os.environ["GOOGLE_REDIRECT_URI"]


class AuthService:

    @staticmethod
    def hash_password(plain_password: str) -> str:
        # bcrypt has a 72-byte password limit
        pwd_bytes = plain_password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()

        return bcrypt.hashpw(
            pwd_bytes,
            salt
        ).decode("utf-8")

    @staticmethod
    def verify_password(
        plain_password: str,
        hashed_password: str
    ) -> bool:
        try:
            pwd_bytes = plain_password.encode("utf-8")[:72]
            hash_bytes = hashed_password.encode("utf-8")

            return bcrypt.checkpw(
                pwd_bytes,
                hash_bytes
            )

        except Exception:
            return False

    @staticmethod
    def create_jwt(
        user_id: str,
        role: Role,
        email: str
    ) -> str:

        now = datetime.now(timezone.utc)

        payload = {
            "sub": str(user_id),
            "role": (
                role.value
                if isinstance(role, Role)
                else str(role)
            ),
            "email": email,
            "exp": int(
                (
                    now + timedelta(
                        minutes=JWT_EXPIRE_MINUTES
                    )
                ).timestamp()
            ),
            "iat": int(now.timestamp())
        }

        return jwt.encode(
            payload,
            JWT_SECRET,
            algorithm=JWT_ALGORITHM
        )

    @staticmethod
    def decode_jwt(
        token: str
    ) -> Optional[Dict[str, Any]]:

        try:
            return jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM]
            )

        except Exception:
            return None

    @staticmethod
    def get_google_auth_url(
        state: Optional[str] = None
    ) -> str:

        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": (
                "openid email profile "
                "https://www.googleapis.com/auth/calendar.events"
            ),
            "access_type": "offline",
            "prompt": "consent",
        }

        if state:
            params["state"] = state

        # Safely encode URL parameters
        query_string = urlencode(params)

        return (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?{query_string}"
        )

    @staticmethod
    async def exchange_google_code_for_tokens(
        code: str
    ) -> Optional[Dict[str, Any]]:

        token_url = "https://oauth2.googleapis.com/token"

        payload = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:

            try:
                response = await client.post(
                    token_url,
                    data=payload,
                    timeout=10.0
                )

                if response.status_code == 200:

                    tokens = response.json()

                    userinfo_resp = await client.get(
                        "https://www.googleapis.com/oauth2/v2/userinfo",
                        headers={
                            "Authorization":
                            f"Bearer {tokens['access_token']}"
                        }
                    )

                    if userinfo_resp.status_code == 200:

                        user_info = userinfo_resp.json()

                        return {
                            **tokens,
                            "user_info": user_info
                        }

            except Exception as e:
                print(
                    f"Error in Google OAuth exchange: {e}"
                )

        return None


auth_service = AuthService()