from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Annotated
from beanie import Document, Indexed
from pydantic import Field

class NotificationType(str, Enum):
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION"
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER"
    CANCELLATION_NOTICE = "CANCELLATION_NOTICE"
    LEAVE_CONFLICT = "LEAVE_CONFLICT"
    POST_VISIT_SUMMARY = "POST_VISIT_SUMMARY"
    MEDICATION_REMINDER = "MEDICATION_REMINDER"

class NotificationStatus(str, Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    FAILED = "FAILED"

class Notification(Document):
    recipient_email: Annotated[str, Indexed()]
    recipient_name: Optional[str] = "Valued Patient"
    notification_type: NotificationType
    subject: str
    template_name: str
    context_data: Dict[str, Any] = {}
    status: NotificationStatus = NotificationStatus.QUEUED
    retry_count: int = 0
    max_retries: int = 5
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"