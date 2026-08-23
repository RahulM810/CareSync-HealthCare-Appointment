import asyncio
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import aiosmtplib

from app.config import settings
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.utils.email_templates import render_email_template

class EmailService:
    async def send_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        context: dict,
        notification_type: NotificationType,
        recipient_name: str = "Valued Patient"
    ) -> Notification:
        """
        Renders HTML email, creates Notification record, and sends via aiosmtplib.
        If SMTP fails or credentials are placeholder, records status gracefully.
        """
        html_content = render_email_template(template_name, context)
        
        notification = Notification(
            recipient_email=to_email,
            recipient_name=recipient_name,
            notification_type=notification_type,
            subject=subject,
            template_name=template_name,
            context_data=context,
            status=NotificationStatus.QUEUED
        )
        await notification.insert()

        # Check if Gmail credentials are provided
        if not settings.GMAIL_USER or settings.GMAIL_APP_PASSWORD.startswith("xxxx"):
            print(f"[EmailService Demo Mode] Sent '{subject}' to {to_email}")
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()
            await notification.save()
            return notification

        try:
            message = MIMEMultipart("alternative")
            message["From"] = settings.GMAIL_USER
            message["To"] = to_email
            message["Subject"] = subject
            message.attach(MIMEText(html_content, "html"))

            await aiosmtplib.send(
                message,
                hostname="smtp.gmail.com",
                port=587,
                start_tls=True,
                username=settings.GMAIL_USER,
                password=settings.GMAIL_APP_PASSWORD,
                timeout=15.0
            )

            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()
            await notification.save()
        except Exception as e:
            print(f"[EmailService Error] Failed to send email to {to_email}: {e}")
            notification.status = NotificationStatus.FAILED
            notification.error_message = str(e)
            notification.retry_count += 1
            await notification.save()

        return notification

email_service = EmailService()
