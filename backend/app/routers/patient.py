from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold, AppointmentStatus
from app.models.notification import NotificationType
from app.schemas.appointment import (
    HoldSlotRequest,
    HoldSlotResponse,
    BookAppointmentRequest,
    RescheduleAppointmentRequest,
    AppointmentResponse,
    SlotItem
)
from app.schemas.doctor import DoctorResponse
from app.middleware.auth import require_role, get_current_user
from app.services.slot_service import slot_service
from app.services.booking_service import booking_service
from app.services.calendar_service import calendar_service
from app.services.email_service import email_service

router = APIRouter()

@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    specialisation: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = DoctorProfile.find(DoctorProfile.is_active == True)
    profiles = await query.to_list()

    results: List[DoctorResponse] = []
    for p in profiles:
        doc_user_id = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
        doc_user = await User.get(doc_user_id)
        if not doc_user:
            continue

        if specialisation and specialisation.lower() not in p.specialisation.lower():
            continue

        if search:
            s = search.lower()
            if s not in doc_user.full_name.lower() and s not in p.specialisation.lower():
                continue

        next_slot = await slot_service.get_next_available_slot(str(p.id))

        results.append(DoctorResponse(
            id=str(p.id),
            user_id=str(doc_user.id),
            email=doc_user.email,
            full_name=doc_user.full_name,
            specialisation=p.specialisation,
            bio=p.bio,
            consultation_fee=p.consultation_fee,
            slot_duration_minutes=p.slot_duration_minutes,
            room_number=p.room_number,
            is_active=p.is_active,
            working_hours=p.working_hours,
            next_available_slot=next_slot
        ))

    return results

@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor_detail(doctor_id: str):
    p = await DoctorProfile.get(doctor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doc_user_id = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
    doc_user = await User.get(doc_user_id)
    if not doc_user:
        raise HTTPException(status_code=404, detail="Doctor user record not found")

    next_slot = await slot_service.get_next_available_slot(str(p.id))

    return DoctorResponse(
        id=str(p.id),
        user_id=str(doc_user.id),
        email=doc_user.email,
        full_name=doc_user.full_name,
        specialisation=p.specialisation,
        bio=p.bio,
        consultation_fee=p.consultation_fee,
        slot_duration_minutes=p.slot_duration_minutes,
        room_number=p.room_number,
        is_active=p.is_active,
        working_hours=p.working_hours,
        next_available_slot=next_slot
    )

@router.get("/doctors/{doctor_id}/slots", response_model=List[SlotItem])
async def get_doctor_slots(
    doctor_id: str,
    date_val: date = Query(..., alias="date")
):
    return await slot_service.get_available_slots(doctor_id, date_val)

@router.post("/slots/hold", response_model=HoldSlotResponse)
async def hold_slot(
    payload: HoldSlotRequest,
    current_user: User = Depends(require_role([Role.PATIENT]))
):
    hold = await booking_service.hold_slot(
        doctor_id=payload.doctor_id,
        start_time=payload.start_time,
        patient_id=str(current_user.id)
    )
    return HoldSlotResponse(
        hold_id=str(hold.id),
        doctor_id=hold.doctor_id,
        start_time=hold.start_time,
        expires_at=hold.expires_at,
        message="Slot successfully held for 5 minutes."
    )

@router.post("/appointments", response_model=AppointmentResponse)
async def book_appointment(
    payload: BookAppointmentRequest,
    current_user: User = Depends(require_role([Role.PATIENT]))
):
    appt = await booking_service.book_appointment(
        doctor_id=payload.doctor_id,
        start_time=payload.start_time,
        patient_id=str(current_user.id),
        symptoms=payload.symptoms
    )
    
    # Resolve names for response
    doctor_profile = await DoctorProfile.get(appt.doctor_id)
    doc_name = "Doctor"
    doc_spec = "General"
    if doctor_profile:
        doc_spec = doctor_profile.specialisation
        doc_user_id = doctor_profile.user.ref.id if hasattr(doctor_profile.user, "ref") else doctor_profile.user.id
        doc_u = await User.get(doc_user_id)
        if doc_u:
            doc_name = doc_u.full_name

    return AppointmentResponse(
        id=str(appt.id),
        doctor_id=appt.doctor_id,
        doctor_name=doc_name,
        doctor_specialisation=doc_spec,
        patient_id=appt.patient_id,
        patient_name=current_user.full_name,
        patient_email=current_user.email,
        start_time=appt.start_time,
        end_time=appt.end_time,
        status=appt.status,
        symptoms=appt.symptoms,
        pre_visit_summary=appt.pre_visit_summary,
        pre_visit_llm_failed=appt.pre_visit_llm_failed,
        clinical_notes=appt.clinical_notes,
        post_visit_summary=appt.post_visit_summary,
        post_visit_llm_failed=appt.post_visit_llm_failed,
        prescriptions=appt.prescriptions,
        google_calendar_synced=appt.google_calendar_synced,
        created_at=appt.created_at,
        updated_at=appt.updated_at
    )

@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(current_user: User = Depends(require_role([Role.PATIENT]))):
    appts = await Appointment.find(
        Appointment.patient_id == str(current_user.id)
    ).sort("-start_time").to_list()

    results: List[AppointmentResponse] = []
    for a in appts:
        doc_profile = await DoctorProfile.get(a.doctor_id)
        doc_name = "Doctor"
        doc_spec = "General"
        if doc_profile:
            doc_spec = doc_profile.specialisation
            doc_uid = doc_profile.user.ref.id if hasattr(doc_profile.user, "ref") else doc_profile.user.id
            doc_u = await User.get(doc_uid)
            if doc_u:
                doc_name = doc_u.full_name

        results.append(AppointmentResponse(
            id=str(a.id),
            doctor_id=a.doctor_id,
            doctor_name=doc_name,
            doctor_specialisation=doc_spec,
            patient_id=a.patient_id,
            patient_name=current_user.full_name,
            patient_email=current_user.email,
            start_time=a.start_time,
            end_time=a.end_time,
            status=a.status,
            symptoms=a.symptoms,
            pre_visit_summary=a.pre_visit_summary,
            pre_visit_llm_failed=a.pre_visit_llm_failed,
            clinical_notes=a.clinical_notes,
            post_visit_summary=a.post_visit_summary,
            post_visit_llm_failed=a.post_visit_llm_failed,
            prescriptions=a.prescriptions,
            google_calendar_synced=a.google_calendar_synced,
            created_at=a.created_at,
            updated_at=a.updated_at
        ))

    return results

@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_detail(
    appointment_id: str,
    current_user: User = Depends(require_role([Role.PATIENT]))
):
    a = await Appointment.get(appointment_id)
    if not a or a.patient_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    doc_profile = await DoctorProfile.get(a.doctor_id)
    doc_name = "Doctor"
    doc_spec = "General"
    if doc_profile:
        doc_spec = doc_profile.specialisation
        doc_uid = doc_profile.user.ref.id if hasattr(doc_profile.user, "ref") else doc_profile.user.id
        doc_u = await User.get(doc_uid)
        if doc_u:
            doc_name = doc_u.full_name

    return AppointmentResponse(
        id=str(a.id),
        doctor_id=a.doctor_id,
        doctor_name=doc_name,
        doctor_specialisation=doc_spec,
        patient_id=a.patient_id,
        patient_name=current_user.full_name,
        patient_email=current_user.email,
        start_time=a.start_time,
        end_time=a.end_time,
        status=a.status,
        symptoms=a.symptoms,
        pre_visit_summary=a.pre_visit_summary,
        pre_visit_llm_failed=a.pre_visit_llm_failed,
        clinical_notes=a.clinical_notes,
        post_visit_summary=a.post_visit_summary,
        post_visit_llm_failed=a.post_visit_llm_failed,
        prescriptions=a.prescriptions,
        google_calendar_synced=a.google_calendar_synced,
        created_at=a.created_at,
        updated_at=a.updated_at
    )

@router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(require_role([Role.PATIENT]))
):
    appt = await Appointment.get(appointment_id)
    if not appt or appt.patient_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Appointment is already cancelled.")

    appt.status = AppointmentStatus.CANCELLED
    appt.updated_at = datetime.utcnow()
    await appt.save()

    # Cancel Google calendar event if synced
    if appt.google_event_id and current_user.google_access_token:
        await calendar_service.delete_event(
            access_token=current_user.google_access_token,
            refresh_token=current_user.google_refresh_token,
            event_id=appt.google_event_id
        )

    # Send cancellation email
    doc_profile = await DoctorProfile.get(appt.doctor_id)
    doc_name = "Doctor"
    if doc_profile:
        doc_uid = doc_profile.user.ref.id if hasattr(doc_profile.user, "ref") else doc_profile.user.id
        doc_u = await User.get(doc_uid)
        if doc_u:
            doc_name = doc_u.full_name

    await email_service.send_email(
        to_email=current_user.email,
        subject=f"Appointment Cancelled - Dr. {doc_name}",
        template_name="cancellation_notice.html",
        context={
            "patient_name": current_user.full_name,
            "doctor_name": doc_name,
            "start_time": appt.start_time.strftime("%B %d, %Y at %I:%M %p")
        },
        notification_type=NotificationType.CANCELLATION_NOTICE,
        recipient_name=current_user.full_name
    )

    return {"message": "Appointment cancelled successfully", "status": appt.status}

@router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: str,
    payload: RescheduleAppointmentRequest,
    current_user: User = Depends(require_role([Role.PATIENT]))
):
    appt = await Appointment.get(appointment_id)
    if not appt or appt.patient_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    profile = await DoctorProfile.get(appt.doctor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check that new slot is available
    duration = timedelta(minutes=profile.slot_duration_minutes)
    conflict = await Appointment.find_one(
        Appointment.doctor_id == appt.doctor_id,
        Appointment.start_time == payload.new_start_time,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.id != appt.id
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Requested new time slot is not available.")

    appt.start_time = payload.new_start_time
    appt.end_time = payload.new_start_time + duration
    appt.status = AppointmentStatus.CONFIRMED
    appt.version += 1
    appt.updated_at = datetime.utcnow()
    await appt.save()

    # Update Google calendar event
    if appt.google_event_id and current_user.google_access_token:
        doc_uid = profile.user.ref.id if hasattr(profile.user, "ref") else profile.user.id
        doc_u = await User.get(doc_uid)
        doc_name = doc_u.full_name if doc_u else "Doctor"
        await calendar_service.update_event(
            access_token=current_user.google_access_token,
            refresh_token=current_user.google_refresh_token,
            event_id=appt.google_event_id,
            title=f"Rescheduled Medical Consultation: Dr. {doc_name}",
            description=f"Symptoms: {appt.symptoms}",
            start_time_iso=appt.start_time.isoformat(),
            end_time_iso=appt.end_time.isoformat()
        )

    return {"message": "Appointment rescheduled successfully", "new_start_time": appt.start_time}