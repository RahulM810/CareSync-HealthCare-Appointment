from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URI: str = "mongodb+srv://rahul:rahul123@taskdb.0xtey5p.mongodb.net/healthcare_db?appName=TaskDB"
    DB_NAME: str = "healthcare_db"
    
    JWT_SECRET: str = "super-secret-key-change-this-in-production-123456"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    GROQ_API_KEY: str = "gsk_placeholder"
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    
    GMAIL_USER: str = "notifications@example.com"
    GMAIL_APP_PASSWORD: str = "xxxx-xxxx-xxxx-xxxx"
    
    GOOGLE_CLIENT_ID: Optional[str] = "placeholder-client-id.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: Optional[str] = "placeholder-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    FRONTEND_URL: str = "http://localhost:4200"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

settings = Settings()