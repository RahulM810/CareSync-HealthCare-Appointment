from datetime import datetime, date, timedelta, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile, DoctorLeave, WorkingHours
from app.models.appointment import Appointment, AppointmentStatus, PrescriptionItem
from app.models.medication_reminder import MedicationReminder, ReminderStatus
from app.models.notification import NotificationType
from app.schemas.appointment import AppointmentResponse, SubmitClinicalNotesRequest
from app.schemas.doctor import DoctorResponse, DoctorLeaveRequest, DoctorLeaveResponse
from app.middleware.auth import require_role
from app.services.llm_service import llm_service
from app.services.email_service import email_service

router = APIRouter()

async def _get_doctor_profile_for_user(user: User) -> DoctorProfile:
    # Try finding profile where user reference matches
    profiles = await DoctorProfile.find_all().to_list()
    for p in profiles:
        doc_uid = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
        if str(doc_uid) == str(user.id):
            return p
    raise HTTPException(status_code=404, detail="Doctor profile not linked to current user.")

@router.get("/dashboard")
async def doctor_dashboard(current_user: User = Depends(require_role([Role.DOCTOR]))):
    profile = await _get_doctor_profile_for_user(current_user)
    today = date.today()
    day_start = datetime.combine(today, time.min)
    day_end = datetime.combine(today, time.max)

    today_appts = await Appointment.find(
        Appointment.doctor_id == str(profile.id),
        Appointment.start_time >= day_start,
        Appointment.start_time <= day_end
    ).sort("start_time").to_list()

    items = []
    urgency_counts = {"High": 0, "Medium": 0, "Low": 0}

    for a in today_appts:
        patient = await User.get(a.patient_id)
        pat_name = patient.full_name if patient else "Patient"
        pat_email = patient.email if patient else ""

        urgency = "Low"
        if a.pre_visit_summary and a.pre_visit_summary.urgency_level:
            urgency = a.pre_visit_summary.urgency_level.value
        urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1

        items.append({
            "id": str(a.id),
            "patient_id": a.patient_id,
            "patient_name": pat_name,
            "patient_email": pat_email,
            "start_time": a.start_time.isoformat(),
            "end_time": a.end_time.isoformat(),
            "status": a.status,
            "symptoms": a.symptoms,
            "urgency_level": urgency,
            "chief_complaint": a.pre_visit_summary.chief_complaint if a.pre_visit_summary else a.symptoms[:60],
            "pre_visit_llm_failed": a.pre_visit_llm_failed,
            "has_notes": bool(a.clinical_notes)
        })

    return {
        "doctor_name": current_user.full_name,
        "specialisation": profile.specialisation,
        "total_today": len(today_appts),
        "urgency_counts": urgency_counts,
        "appointments": items
    }

@router.get("/appointments", response_model=List[AppointmentResponse])
async def doctor_all_appointments(
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    current_user: User = Depends(require_role([Role.DOCTOR]))
):
    profile = await _get_doctor_profile_for_user(current_user)
    
    query_dict = {"doctor_id": str(profile.id)}
    if status_filter:
        query_dict["status"] = status_filter

    appts = await Appointment.find(query_dict).sort("-start_time").to_list()
    results: List[AppointmentResponse] = []

    for a in appts:
        patient = await User.get(a.patient_id)
        pat_name = patient.full_name if patient else "Patient"
        pat_email = patient.email if patient else ""

        results.append(AppointmentResponse(
            id=str(a.id),
            doctor_id=a.doctor_id,
            doctor_name=current_user.full_name,
            doctor_specialisation=profile.specialisation,
            patient_id=a.patient_id,
            patient_name=pat_name,
            patient_email=pat_email,
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
async def doctor_get_appointment_detail(
    appointment_id: str,
    current_user: User = Depends(require_role([Role.DOCTOR]))
):
    profile = await _get_doctor_profile_for_user(current_user)
    a = await Appointment.get(appointment_id)
    if not a or a.doctor_id != str(profile.id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = await User.get(a.patient_id)
    pat_name = patient.full_name if patient else "Patient"
    pat_email = patient.email if patient else ""

    return AppointmentResponse(
        id=str(a.id),
        doctor_id=a.doctor_id,
        doctor_name=current_user.full_name,
        doctor_specialisation=profile.specialisation,
        patient_id=a.patient_id,
        patient_name=pat_name,
        patient_email=pat_email,
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

@router.post("/appointments/{appointment_id}/notes", response_model=AppointmentResponse)
async def doctor_submit_notes(
    appointment_id: str,
    payload: SubmitClinicalNotesRequest,
    current_user: User = Depends(require_role([Role.DOCTOR]))
):
    profile = await _get_doctor_profile_for_user(current_user)
    a = await Appointment.get(appointment_id)
    if not a or a.doctor_id != str(profile.id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = await User.get(a.patient_id)
    pat_name = patient.full_name if patient else "Patient"
    pat_email = patient.email if patient else ""

    # Generate post-visit summary via Groq LLM (non-blocking fallback)
    post_summary, llm_failed = await llm_service.generate_post_visit_summary(payload.clinical_notes)

    a.clinical_notes = payload.clinical_notes
    a.post_visit_summary = post_summary
    a.post_visit_llm_failed = llm_failed
    a.prescriptions = payload.prescriptions
    a.status = AppointmentStatus.COMPLETED
    a.updated_at = datetime.utcnow()
    await a.save()

    # Create medication reminders for prescriptions
    today = date.today()
    for rx in payload.prescriptions:
        rem = MedicationReminder(
            appointment_id=str(a.id),
            patient_id=a.patient_id,
            patient_email=pat_email,
            patient_name=pat_name,
            medicine=rx.medicine,
            dosage=rx.dosage,
            frequency=rx.frequency,
            start_date=today,
            end_date=today + timedelta(days=rx.duration_days),
            status=ReminderStatus.ACTIVE
        )
        await rem.insert()

    # Send post-visit summary email to patient
    if pat_email:
        await email_service.send_email(
            to_email=pat_email,
            subject=f"Post-Visit Summary & Care Plan - Dr. {current_user.full_name}",
            template_name="post_visit_summary.html",
            context={
                "patient_name": pat_name,
                "doctor_name": current_user.full_name,
                "post_visit_summary": post_summary,
                "prescriptions": [rx.model_dump() for rx in payload.prescriptions]
            },
            notification_type=NotificationType.POST_VISIT_SUMMARY,
            recipient_name=pat_name
        )

    return AppointmentResponse(
        id=str(a.id),
        doctor_id=a.doctor_id,
        doctor_name=current_user.full_name,
        doctor_specialisation=profile.specialisation,
        patient_id=a.patient_id,
        patient_name=pat_name,
        patient_email=pat_email,
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

@router.get("/schedule")
async def doctor_schedule(current_user: User = Depends(require_role([Role.DOCTOR]))):
    profile = await _get_doctor_profile_for_user(current_user)
    leaves = await DoctorLeave.find(DoctorLeave.doctor_id == str(profile.id)).to_list()
    return {
        "doctor_id": str(profile.id),
        "working_hours": profile.working_hours,
        "slot_duration_minutes": profile.slot_duration_minutes,
        "leaves": [
            {
                "id": str(l.id),
                "leave_date": l.leave_date.isoformat(),
                "reason": l.reason,
                "affected_appointments": l.affected_appointments
            }
            for l in leaves
        ]
    }

@router.post("/leave", response_model=DoctorLeaveResponse)
async def doctor_request_leave(
    payload: DoctorLeaveRequest,
    current_user: User = Depends(require_role([Role.DOCTOR]))
):
    profile = await _get_doctor_profile_for_user(current_user)
    
    # Check if already on leave
    existing = await DoctorLeave.find_one(
        DoctorLeave.doctor_id == str(profile.id),
        DoctorLeave.leave_date == payload.leave_date
    )
    if existing:
        raise HTTPException(status_code=400, detail="Leave already recorded for this date.")

    # Find affected appointments
    day_start = datetime.combine(payload.leave_date, time.min)
    day_end = datetime.combine(payload.leave_date, time.max)
    affected_appts = await Appointment.find(
        Appointment.doctor_id == str(profile.id),
        Appointment.start_time >= day_start,
        Appointment.start_time <= day_end,
        Appointment.status == AppointmentStatus.CONFIRMED
    ).to_list()

    leave = DoctorLeave(
        doctor_id=str(profile.id),
        leave_date=payload.leave_date,
        reason=payload.reason,
        affected_appointments=len(affected_appts)
    )
    await leave.insert()

    # Notify affected patients
    for appt in affected_appts:
        patient = await User.get(appt.patient_id)
        if patient and patient.email:
            await email_service.send_email(
                to_email=patient.email,
                subject=f"Reschedule Required: Dr. {current_user.full_name} is on Leave",
                template_name="leave_conflict.html",
                context={
                    "patient_name": patient.full_name,
                    "doctor_name": current_user.full_name,
                    "leave_date": payload.leave_date.strftime("%B %d, %Y"),
                    "start_time": appt.start_time.strftime("%B %d, %Y at %I:%M %p")
                },
                notification_type=NotificationType.LEAVE_CONFLICT,
                recipient_name=patient.full_name
            )

    return DoctorLeaveResponse(
        id=str(leave.id),
        doctor_id=leave.doctor_id,
        leave_date=leave.leave_date,
        reason=leave.reason,
        affected_appointments=leave.affected_appointments
    )