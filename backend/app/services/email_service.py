import os
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from dotenv import load_dotenv

from app.models.notification import (
    Notification,
    NotificationType,
    NotificationStatus
)
from app.utils.email_templates import render_email_template


# Load environment variables
load_dotenv()

# Gmail configuration
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


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
        Renders HTML email, creates a Notification record,
        and sends the email using Gmail SMTP.
        """

        # Render HTML email
        html_content = render_email_template(
            template_name,
            context
        )

        # Create notification record
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

        # Demo mode if Gmail credentials are not configured
        if (
            not GMAIL_USER
            or not GMAIL_APP_PASSWORD
            or GMAIL_APP_PASSWORD.startswith("xxxx")
        ):
            print(
                f"[EmailService Demo Mode] "
                f"Sent '{subject}' to {to_email}"
            )

            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()

            await notification.save()

            return notification

        try:
            # Create email message
            message = MIMEMultipart("alternative")

            message["From"] = GMAIL_USER
            message["To"] = to_email
            message["Subject"] = subject

            message.attach(
                MIMEText(
                    html_content,
                    "html"
                )
            )

            # Send email
            await aiosmtplib.send(
                message,
                hostname="smtp.gmail.com",
                port=587,
                start_tls=True,
                username=GMAIL_USER,
                password=GMAIL_APP_PASSWORD,
                timeout=15.0
            )

            # Update notification status
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()

            await notification.save()

        except Exception as e:

            print(
                f"[EmailService Error] "
                f"Failed to send email to {to_email}: {e}"
            )

            notification.status = NotificationStatus.FAILED
            notification.error_message = str(e)
            notification.retry_count += 1

            await notification.save()

        return notification


email_service = EmailService()