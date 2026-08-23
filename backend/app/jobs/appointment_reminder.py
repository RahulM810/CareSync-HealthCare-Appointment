from datetime import datetime, timedelta
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.models.notification import NotificationType
from app.services.email_service import email_service

async def run_appointment_reminders():
    """
    Finds appointments happening in the next 24-25 hours and dispatches reminder emails.
    """
    now = datetime.utcnow()
    reminder_start = now + timedelta(hours=23)
    reminder_end = now + timedelta(hours=25)

    upcoming_appts = await Appointment.find(
        Appointment.start_time >= reminder_start,
        Appointment.start_time <= reminder_end,
        Appointment.status == AppointmentStatus.CONFIRMED
    ).to_list()

    for appt in upcoming_appts:
        patient = await User.get(appt.patient_id)
        doctor_profile = await DoctorProfile.get(appt.doctor_id)
        doctor_user = None
        if doctor_profile:
            doc_uid = doctor_profile.user.ref.id if hasattr(doctor_profile.user, "ref") else doctor_profile.user.id
            doctor_user = await User.get(doc_uid)

        doc_name = doctor_user.full_name if doctor_user else "Doctor"
        pat_name = patient.full_name if patient else "Patient"

        if patient and patient.email:
            await email_service.send_email(
                to_email=patient.email,
                subject=f"24-Hour Reminder: Appointment with Dr. {doc_name}",
                template_name="appointment_reminder.html",
                context={
                    "patient_name": pat_name,
                    "doctor_name": doc_name,
                    "start_time": appt.start_time.strftime("%B %d, %Y at %I:%M %p"),
                    "room_number": doctor_profile.room_number if doctor_profile else "Main Clinic"
                },
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                recipient_name=pat_name
            )
