from app.services.notification_service import notification_service

async def run_retry_failed_emails():
    """
    Cron job executing every 30 minutes to retry failed email notifications.
    """
    await notification_service.retry_failed_notifications()
