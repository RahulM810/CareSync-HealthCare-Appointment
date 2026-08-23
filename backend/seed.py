import asyncio
from datetime import datetime, date, timedelta, time
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User, Role
from app.models.doctor_profile import DoctorProfile, DoctorLeave, WorkingHours
from app.models.appointment import Appointment, SlotHold, AppointmentStatus, UrgencyLevel, PreVisitSummary, PrescriptionItem
from app.models.medication_reminder import MedicationReminder, ReminderStatus
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.services.auth_service import auth_service

async def seed_data():
    print(f"Connecting to MongoDB database: {settings.DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    database = client.get_database(settings.DB_NAME)

    await init_beanie(
        database=database,
        document_models=[
            User,
            DoctorProfile,
            DoctorLeave,
            SlotHold,
            Appointment,
            MedicationReminder,
            Notification
        ]
    )

    # Clear existing demo data or check if admin exists
    admin_user = await User.find_one(User.email == "admin@healthcare.com")
    if admin_user:
        print("Admin user already exists. Overwriting demo records to guarantee fresh state...")
        await User.find_all().delete()
        await DoctorProfile.find_all().delete()
        await DoctorLeave.find_all().delete()
        await Appointment.find_all().delete()
        await SlotHold.find_all().delete()
        await MedicationReminder.find_all().delete()
        await Notification.find_all().delete()

    default_pw = auth_service.hash_password("password123")

    # 1. Admin
    admin = User(
        email="admin@healthcare.com",
        password_hash=default_pw,
        full_name="Hospital Administrator",
        role=Role.ADMIN
    )
    await admin.insert()

    # 2. Doctors
    doctors_info = [
        {
            "name": "Dr. Sarah Jenkins",
            "email": "dr.sarah@healthcare.com",
            "spec": "Cardiology",
            "bio": "Board-certified cardiologist with 14 years of clinical experience in preventive heart health.",
            "fee": 120.0,
            "room": "Cardio Suite 301"
        },
        {
            "name": "Dr. Marcus Vance",
            "email": "dr.marcus@healthcare.com",
            "spec": "Dermatology",
            "bio": "Specialist in inflammatory skin conditions, mole mapping, and advanced dermatological care.",
            "fee": 95.0,
            "room": "Derm Care 204"
        },
        {
            "name": "Dr. Elena Rostova",
            "email": "dr.elena@healthcare.com",
            "spec": "Pediatrics",
            "bio": "Compassionate pediatrician committed to newborn care, adolescent health, and developmental tracking.",
            "fee": 85.0,
            "room": "Pediatrics Wing 105"
        },
        {
            "name": "Dr. Alex Rivera",
            "email": "dr.alex@healthcare.com",
            "spec": "General Medicine",
            "bio": "Primary care physician dedicated to comprehensive diagnostics and holistic wellness plans.",
            "fee": 70.0,
            "room": "Consultation 101"
        }
    ]

    doctor_profiles = []
    for doc in doctors_info:
        u = User(
            email=doc["email"],
            password_hash=default_pw,
            full_name=doc["name"],
            role=Role.DOCTOR
        )
        await u.insert()

        prof = DoctorProfile(
            user=u,
            specialisation=doc["spec"],
            bio=doc["bio"],
            consultation_fee=doc["fee"],
            slot_duration_minutes=30,
            room_number=doc["room"],
            is_active=True
        )
        await prof.insert()
        doctor_profiles.append(prof)

    # 3. Patients
    patient1 = User(
        email="patient.john@example.com",
        password_hash=default_pw,
        full_name="John Doe",
        role=Role.PATIENT,
        phone_number="+1 555-019-2834"
    )
    await patient1.insert()

    patient2 = User(
        email="patient.emma@example.com",
        password_hash=default_pw,
        full_name="Emma Watson",
        role=Role.PATIENT,
        phone_number="+1 555-014-9921"
    )
    await patient2.insert()

    # 4. Sample Appointments with AI Triage summaries
    today = date.today()
    
    # High urgency appointment today for Dr. Sarah
    appt1_time = datetime.combine(today, time(hour=10, minute=0))
    appt1 = Appointment(
        doctor_id=str(doctor_profiles[0].id),
        patient_id=str(patient1.id),
        start_time=appt1_time,
        end_time=appt1_time + timedelta(minutes=30),
        status=AppointmentStatus.CONFIRMED,
        symptoms="Experiencing sudden sharp chest tightness and shortness of breath when walking up stairs.",
        pre_visit_summary=PreVisitSummary(
            urgency_level=UrgencyLevel.HIGH,
            chief_complaint="Exertional acute chest discomfort and dyspnea",
            suggested_questions=[
                "Does the pain radiate to your left arm or jaw?",
                "Are you experiencing any palpitations or nausea?",
                "Do you have a personal or family history of coronary artery disease?"
            ]
        ),
        pre_visit_llm_failed=False
    )
    await appt1.insert()

    # Medium urgency appointment today for Dr. Alex (General Medicine)
    appt2_time = datetime.combine(today, time(hour=11, minute=30))
    appt2 = Appointment(
        doctor_id=str(doctor_profiles[3].id),
        patient_id=str(patient2.id),
        start_time=appt2_time,
        end_time=appt2_time + timedelta(minutes=30),
        status=AppointmentStatus.CONFIRMED,
        symptoms="Persistent dry cough for 5 days, mild fever at 100.4F, and throat irritation.",
        pre_visit_summary=PreVisitSummary(
            urgency_level=UrgencyLevel.MEDIUM,
            chief_complaint="Subacute upper respiratory symptoms with low-grade pyrexia",
            suggested_questions=[
                "Have you had close contact with anyone having flu or COVID-19?",
                "Are you producing any phlegm or discolored mucus?",
                "Have you used any antipyretics like acetaminophen?"
            ]
        ),
        pre_visit_llm_failed=False
    )
    await appt2.insert()

    # Completed appointment yesterday with clinical notes and prescriptions
    yesterday = today - timedelta(days=1)
    appt3_time = datetime.combine(yesterday, time(hour=14, minute=0))
    appt3 = Appointment(
        doctor_id=str(doctor_profiles[1].id),
        patient_id=str(patient1.id),
        start_time=appt3_time,
        end_time=appt3_time + timedelta(minutes=30),
        status=AppointmentStatus.COMPLETED,
        symptoms="Itchy red circular patch on forearm that has been spreading over 2 weeks.",
        pre_visit_summary=PreVisitSummary(
            urgency_level=UrgencyLevel.LOW,
            chief_complaint="Spreading annular pruritic cutaneous lesion",
            suggested_questions=[
                "Have you handled pets or been outdoors frequently?",
                "Have you applied any OTC steroid creams?",
                "Is the area tender or weeping?"
            ]
        ),
        clinical_notes="Patient presents with localized tinea corporis (ringworm) on left forearm. No secondary bacterial infection noted.",
        post_visit_summary="You have been diagnosed with a mild fungal skin infection (ringworm). It is completely curable with topical antifungal therapy. Keep the affected area clean and dry, avoid sharing towels, and finish the full course of antifungal cream.",
        prescriptions=[
            PrescriptionItem(
                medicine="Clotrimazole 1% Cream",
                dosage="Thin layer applied twice daily",
                frequency="Every 12 hours",
                duration_days=14,
                instructions="Apply after washing and drying skin thoroughly."
            ),
            PrescriptionItem(
                medicine="Cetirizine 10mg",
                dosage="1 tablet once daily at bedtime",
                frequency="Daily",
                duration_days=5,
                instructions="Take for itch relief if needed."
            )
        ]
    )
    await appt3.insert()

    # 5. Medication reminder for John Doe
    reminder = MedicationReminder(
        appointment_id=str(appt3.id),
        patient_id=str(patient1.id),
        patient_email=patient1.email,
        patient_name=patient1.full_name,
        medicine="Clotrimazole 1% Cream",
        dosage="Apply twice daily",
        frequency="Every 12 hours",
        start_date=yesterday,
        end_date=yesterday + timedelta(days=14),
        status=ReminderStatus.ACTIVE
    )
    await reminder.insert()

    print("\n[SUCCESS] Seed completed successfully!")
    print("\n=======================================================")
    print("  HEALTHCARE APPOINTMENT SYSTEM - DEMO CREDENTIALS ")
    print("=======================================================")
    print(" * Admin:   admin@healthcare.com      | password123")
    print(" * Doctor:  dr.sarah@healthcare.com    | password123 (Cardiology)")
    print(" * Doctor:  dr.alex@healthcare.com     | password123 (General Med)")
    print(" * Doctor:  dr.marcus@healthcare.com   | password123 (Dermatology)")
    print(" * Doctor:  dr.elena@healthcare.com    | password123 (Pediatrics)")
    print(" * Patient: patient.john@example.com   | password123")
    print(" * Patient: patient.emma@example.com   | password123")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(seed_data())