from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import NotificationType
from app.schemas.doctor import (
    CreateDoctorRequest,
    UpdateDoctorRequest,
    DoctorResponse,
    DoctorLeaveRequest,
    DoctorLeaveResponse
)
from app.schemas.appointment import AppointmentResponse
from app.schemas.common import NotificationStatsResponse
from app.middleware.auth import require_role
from app.services.auth_service import auth_service
from app.services.email_service import email_service
from app.services.notification_service import notification_service

router = APIRouter()

@router.get("/doctors", response_model=List[DoctorResponse])
async def admin_list_doctors(admin: User = Depends(require_role([Role.ADMIN]))):
    profiles = await DoctorProfile.find_all().to_list()
    results: List[DoctorResponse] = []
    for p in profiles:
        doc_uid = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
        doc_user = await User.get(doc_uid)
        if not doc_user:
            continue
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
            working_hours=p.working_hours
        ))
    return results

@router.post("/doctors", response_model=DoctorResponse)
async def admin_create_doctor(
    payload: CreateDoctorRequest,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    hashed_pw = auth_service.hash_password(payload.password)
    user = User(
        email=payload.email,
        password_hash=hashed_pw,
        full_name=payload.full_name,
        role=Role.DOCTOR
    )
    await user.insert()

    profile = DoctorProfile(
        user=user,
        specialisation=payload.specialisation,
        bio=payload.bio,
        consultation_fee=payload.consultation_fee,
        slot_duration_minutes=payload.slot_duration_minutes,
        room_number=payload.room_number,
        working_hours=payload.working_hours if payload.working_hours else DoctorProfile().working_hours
    )
    await profile.insert()

    return DoctorResponse(
        id=str(profile.id),
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        specialisation=profile.specialisation,
        bio=profile.bio,
        consultation_fee=profile.consultation_fee,
        slot_duration_minutes=profile.slot_duration_minutes,
        room_number=profile.room_number,
        is_active=profile.is_active,
        working_hours=profile.working_hours
    )

@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def admin_get_doctor(
    doctor_id: str,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    p = await DoctorProfile.get(doctor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doc_uid = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
    doc_user = await User.get(doc_uid)
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
        working_hours=p.working_hours
    )

@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def admin_update_doctor(
    doctor_id: str,
    payload: UpdateDoctorRequest,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    p = await DoctorProfile.get(doctor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doc_uid = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
    doc_user = await User.get(doc_uid)

    if payload.full_name and doc_user:
        doc_user.full_name = payload.full_name
        await doc_user.save()

    if payload.specialisation is not None:
        p.specialisation = payload.specialisation
    if payload.bio is not None:
        p.bio = payload.bio
    if payload.consultation_fee is not None:
        p.consultation_fee = payload.consultation_fee
    if payload.slot_duration_minutes is not None:
        p.slot_duration_minutes = payload.slot_duration_minutes
    if payload.room_number is not None:
        p.room_number = payload.room_number
    if payload.is_active is not None:
        p.is_active = payload.is_active
    if payload.working_hours is not None:
        p.working_hours = payload.working_hours

    await p.save()

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
        working_hours=p.working_hours
    )

@router.delete("/doctors/{doctor_id}")
async def admin_deactivate_doctor(
    doctor_id: str,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    p = await DoctorProfile.get(doctor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")
    p.is_active = False
    await p.save()
    return {"message": "Doctor deactivated successfully"}

@router.post("/doctors/{doctor_id}/leave", response_model=DoctorLeaveResponse)
async def admin_create_doctor_leave(
    doctor_id: str,
    payload: DoctorLeaveRequest,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    p = await DoctorProfile.get(doctor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doc_uid = p.user.ref.id if hasattr(p.user, "ref") else p.user.id
    doc_user = await User.get(doc_uid)

    day_start = datetime.combine(payload.leave_date, time.min)
    day_end = datetime.combine(payload.leave_date, time.max)
    affected = await Appointment.find(
        Appointment.doctor_id == doctor_id,
        Appointment.start_time >= day_start,
        Appointment.start_time <= day_end,
        Appointment.status == AppointmentStatus.CONFIRMED
    ).to_list()

    leave = DoctorLeave(
        doctor_id=doctor_id,
        leave_date=payload.leave_date,
        reason=payload.reason,
        affected_appointments=len(affected)
    )
    await leave.insert()

    # Dispatch alerts to affected patients
    for appt in affected:
        patient = await User.get(appt.patient_id)
        if patient and patient.email:
            await email_service.send_email(
                to_email=patient.email,
                subject=f"Notice: Doctor Leave on {payload.leave_date.strftime('%B %d, %Y')}",
                template_name="leave_conflict.html",
                context={
                    "patient_name": patient.full_name,
                    "doctor_name": doc_user.full_name if doc_user else "Doctor",
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

@router.get("/doctors/{doctor_id}/leave", response_model=List[DoctorLeaveResponse])
async def admin_list_doctor_leaves(
    doctor_id: str,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    leaves = await DoctorLeave.find(DoctorLeave.doctor_id == doctor_id).sort("-leave_date").to_list()
    return [
        DoctorLeaveResponse(
            id=str(l.id),
            doctor_id=l.doctor_id,
            leave_date=l.leave_date,
            reason=l.reason,
            affected_appointments=l.affected_appointments
        )
        for l in leaves
    ]

@router.delete("/doctors/{doctor_id}/leave/{leave_id}")
async def admin_cancel_doctor_leave(
    doctor_id: str,
    leave_id: str,
    admin: User = Depends(require_role([Role.ADMIN]))
):
    leave = await DoctorLeave.get(leave_id)
    if not leave or leave.doctor_id != doctor_id:
        raise HTTPException(status_code=404, detail="Leave record not found")
    await leave.delete()
    return {"message": "Leave cancelled successfully"}

@router.get("/appointments", response_model=List[AppointmentResponse])
async def admin_all_appointments(
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    doctor_id: Optional[str] = Query(None),
    admin: User = Depends(require_role([Role.ADMIN]))
):
    query_dict = {}
    if status_filter:
        query_dict["status"] = status_filter
    if doctor_id:
        query_dict["doctor_id"] = doctor_id

    appts = await Appointment.find(query_dict).sort("-start_time").to_list()
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

        patient = await User.get(a.patient_id)
        pat_name = patient.full_name if patient else "Patient"
        pat_email = patient.email if patient else ""

        results.append(AppointmentResponse(
            id=str(a.id),
            doctor_id=a.doctor_id,
            doctor_name=doc_name,
            doctor_specialisation=doc_spec,
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

@router.get("/notifications", response_model=NotificationStatsResponse)
async def admin_get_notifications(admin: User = Depends(require_role([Role.ADMIN]))):
    return await notification_service.get_stats()