from datetime import datetime
from typing import Dict, Any, List
from app.models.notification import Notification, NotificationStatus, NotificationType
from app.schemas.common import NotificationStatsResponse
from app.services.email_service import email_service

class NotificationService:
    async def get_stats(self) -> NotificationStatsResponse:
        total = await Notification.count()
        sent = await Notification.find(Notification.status == NotificationStatus.SENT).count()
        queued = await Notification.find(Notification.status == NotificationStatus.QUEUED).count()
        failed = await Notification.find(Notification.status == NotificationStatus.FAILED).count()
        
        recent = await Notification.find().sort("-created_at").limit(20).to_list()
        recent_logs = [
            {
                "id": str(n.id),
                "recipient_email": n.recipient_email,
                "recipient_name": n.recipient_name,
                "notification_type": n.notification_type,
                "subject": n.subject,
                "status": n.status,
                "retry_count": n.retry_count,
                "error_message": n.error_message,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
                "created_at": n.created_at.isoformat()
            }
            for n in recent
        ]

        return NotificationStatsResponse(
            total_notifications=total,
            sent=sent,
            queued=queued,
            failed=failed,
            recent_logs=recent_logs
        )

    async def retry_failed_notifications(self):
        """
        Scans for failed notifications with retry_count < 5 and re-attempts delivery.
        """
        failed_notifications = await Notification.find(
            Notification.status == NotificationStatus.FAILED,
            Notification.retry_count < 5
        ).to_list()

        for notif in failed_notifications:
            notif.retry_count += 1
            await notif.save()
            
            # Re-dispatch
            await email_service.send_email(
                to_email=notif.recipient_email,
                subject=notif.subject,
                template_name=notif.template_name,
                context=notif.context_data,
                notification_type=notif.notification_type,
                recipient_name=notif.recipient_name or "Valued Patient"
            )

notification_service = NotificationService()
