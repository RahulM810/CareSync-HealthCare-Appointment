from typing import Optional, Any, List, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None

class NotificationStatsResponse(BaseModel):
    total_notifications: int
    sent: int
    queued: int
    failed: int
    recent_logs: List[dict] = []
