from datetime import date, datetime
from app.models.medication_reminder import MedicationReminder, ReminderStatus
from app.models.notification import NotificationType
from app.services.email_service import email_service

async def run_medication_reminders():
    """
    Finds active medication reminders and sends daily reminders to patients.
    """
    today = date.today()
    active_reminders = await MedicationReminder.find(
        MedicationReminder.status == ReminderStatus.ACTIVE,
        MedicationReminder.start_date <= today,
        MedicationReminder.end_date >= today
    ).to_list()

    for rem in active_reminders:
        # Check if already sent today
        if rem.last_sent_at and rem.last_sent_at.date() == today:
            continue

        await email_service.send_email(
            to_email=rem.patient_email,
            subject=f"Daily Medication Reminder: {rem.medicine}",
            template_name="medication_reminder.html",
            context={
                "patient_name": rem.patient_name,
                "medicine": rem.medicine,
                "dosage": rem.dosage,
                "frequency": rem.frequency
            },
            notification_type=NotificationType.MEDICATION_REMINDER,
            recipient_name=rem.patient_name
        )

        rem.last_sent_at = datetime.utcnow()
        await rem.save()
