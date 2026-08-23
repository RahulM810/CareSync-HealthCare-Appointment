import asyncio
from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment, SlotHold, AppointmentStatus
from app.models.notification import NotificationType
from app.services.llm_service import llm_service
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service

class BookingService:
    async def hold_slot(self, doctor_id: str, start_time: datetime, patient_id: str) -> SlotHold:
        """
        Layer 1: Places a 5-minute temporary hold on a slot.
        """
        # Ensure doctor exists
        profile = await DoctorProfile.get(doctor_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor profile not found")

        # Check if already booked
        existing_appt = await Appointment.find_one(
            Appointment.doctor_id == doctor_id,
            Appointment.start_time == start_time,
            Appointment.status != AppointmentStatus.CANCELLED
        )
        if existing_appt:
            raise HTTPException(status_code=409, detail="This time slot has already been booked.")

        # Check if already held by another user
        now = datetime.utcnow()
        active_hold = await SlotHold.find_one(
            SlotHold.doctor_id == doctor_id,
            SlotHold.start_time == start_time,
            SlotHold.expires_at > now
        )
        if active_hold and active_hold.patient_id != patient_id:
            raise HTTPException(status_code=409, detail="Slot is currently held by another patient. Please try another slot.")

        # Clean old hold if re-holding by same user
        if active_hold and active_hold.patient_id == patient_id:
            await active_hold.delete()

        hold = SlotHold(
            doctor_id=doctor_id,
            patient_id=patient_id,
            start_time=start_time,
            expires_at=now + timedelta(minutes=5)
        )
        try:
            await hold.insert()
            return hold
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="Slot was just held by another user.")

    async def book_appointment(
        self,
        doctor_id: str,
        start_time: datetime,
        patient_id: str,
        symptoms: str
    ) -> Appointment:
        """
        Layer 2 & 3: Atomic booking with concurrency control and async post-booking triggers.
        """
        profile = await DoctorProfile.get(doctor_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
        doctor_user = await User.get(profile.user.ref.id if hasattr(profile.user, "ref") else profile.user.id)
        patient_user = await User.get(patient_id)

        duration = timedelta(minutes=profile.slot_duration_minutes)
        end_time = start_time + duration

        # Pre-visit LLM triage (non-blocking fallback)
        summary, llm_failed = await llm_service.generate_pre_visit_summary(symptoms)

        appointment = Appointment(
            doctor_id=doctor_id,
            patient_id=patient_id,
            start_time=start_time,
            end_time=end_time,
            status=AppointmentStatus.CONFIRMED,
            symptoms=symptoms,
            pre_visit_summary=summary,
            pre_visit_llm_failed=llm_failed,
            version=1
        )

        try:
            await appointment.insert()
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="Double-booking prevented: This slot has just been confirmed by another booking.")

        # Release any SlotHold for this slot
        await SlotHold.find(
            SlotHold.doctor_id == doctor_id,
            SlotHold.start_time == start_time
        ).delete()

        # Asynchronous Post-Booking Actions (Non-blocking)
        asyncio.create_task(self._trigger_post_booking_side_effects(appointment, doctor_user, patient_user, profile))

        return appointment

    async def _trigger_post_booking_side_effects(
        self,
        appointment: Appointment,
        doctor_user: Optional[User],
        patient_user: Optional[User],
        profile: DoctorProfile
    ):
        doc_name = doctor_user.full_name if doctor_user else "Doctor"
        pat_name = patient_user.full_name if patient_user else "Patient"
        time_str = appointment.start_time.strftime("%B %d, %Y at %I:%M %p")

        # 1. Send Confirmation Email to Patient
        if patient_user and patient_user.email:
            await email_service.send_email(
                to_email=patient_user.email,
                subject=f"Appointment Confirmation - Dr. {doc_name}",
                template_name="booking_confirmation.html",
                context={
                    "patient_name": pat_name,
                    "doctor_name": doc_name,
                    "doctor_specialisation": profile.specialisation,
                    "start_time": time_str,
                    "room_number": profile.room_number,
                    "symptoms": appointment.symptoms
                },
                notification_type=NotificationType.BOOKING_CONFIRMATION,
                recipient_name=pat_name
            )

        # 2. Sync to Google Calendar if Patient has connected Google
        if patient_user and patient_user.google_access_token:
            event_id = await calendar_service.create_event(
                access_token=patient_user.google_access_token,
                refresh_token=patient_user.google_refresh_token,
                title=f"Medical Consultation: Dr. {doc_name}",
                description=f"Specialisation: {profile.specialisation}\nSymptoms: {appointment.symptoms}\nRoom: {profile.room_number}",
                start_time_iso=appointment.start_time.isoformat(),
                end_time_iso=appointment.end_time.isoformat(),
                location=f"{profile.room_number}, Main Health Clinic"
            )
            if event_id:
                appointment.google_event_id = event_id
                appointment.google_calendar_synced = True
                await appointment.save()

booking_service = BookingService()
