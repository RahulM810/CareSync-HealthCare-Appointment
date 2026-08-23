from datetime import datetime, date, timedelta, time
from typing import List, Optional
from app.models.doctor_profile import DoctorProfile, DoctorLeave
from app.models.appointment import Appointment, SlotHold, AppointmentStatus
from app.schemas.appointment import SlotItem

class SlotService:
    async def get_available_slots(self, doctor_id: str, date_val: date) -> List[SlotItem]:
        """
        Calculates all available booking slots for a doctor on a specific date.
        Considers doctor working hours, leaves, booked appointments, and active 5-min holds.
        """
        profile = await DoctorProfile.get(doctor_id)
        if not profile or not profile.is_active:
            return []

        # Check if doctor is on leave
        on_leave = await DoctorLeave.find_one(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == date_val
        )
        if on_leave:
            return []

        # Check working hours for day of week (0=Mon ... 6=Sun)
        weekday = date_val.weekday()
        day_schedule = next((wh for wh in profile.working_hours if wh.day_of_week == weekday), None)
        if not day_schedule or not day_schedule.is_working:
            return []

        slot_duration = timedelta(minutes=profile.slot_duration_minutes)
        start_dt = datetime.combine(date_val, time(hour=day_schedule.start_hour, minute=0))
        end_dt = datetime.combine(date_val, time(hour=day_schedule.end_hour, minute=0))

        # Generate all possible day slots
        all_slots = []
        curr = start_dt
        while curr + slot_duration <= end_dt:
            all_slots.append((curr, curr + slot_duration))
            curr += slot_duration

        # Fetch existing appointments on that date
        day_start = datetime.combine(date_val, time.min)
        day_end = datetime.combine(date_val, time.max)

        existing_appts = await Appointment.find(
            Appointment.doctor_id == doctor_id,
            Appointment.start_time >= day_start,
            Appointment.start_time <= day_end,
            Appointment.status != AppointmentStatus.CANCELLED
        ).to_list()
        booked_times = {a.start_time for a in existing_appts}

        # Fetch active slot holds
        now = datetime.utcnow()
        active_holds = await SlotHold.find(
            SlotHold.doctor_id == doctor_id,
            SlotHold.start_time >= day_start,
            SlotHold.start_time <= day_end,
            SlotHold.expires_at > now
        ).to_list()
        held_times = {h.start_time for h in active_holds}

        result: List[SlotItem] = []
        for s_start, s_end in all_slots:
            is_avail = (s_start not in booked_times) and (s_start not in held_times)
            result.append(SlotItem(
                start_time=s_start,
                end_time=s_end,
                is_available=is_avail
            ))

        return result

    async def get_next_available_slot(self, doctor_id: str) -> Optional[str]:
        """
        Finds the earliest available slot within the next 14 days.
        """
        today = date.today()
        for offset in range(14):
            target_date = today + timedelta(days=offset)
            slots = await self.get_available_slots(doctor_id, target_date)
            available = [s for s in slots if s.is_available and (offset > 0 or s.start_time > datetime.now())]
            if available:
                return available[0].start_time.isoformat()
        return None

slot_service = SlotService()
