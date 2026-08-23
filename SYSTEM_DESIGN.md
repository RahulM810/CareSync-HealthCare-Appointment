# CareSync — System Design & Architecture

## Overview

CareSync is a full-stack healthcare appointment and follow-up platform built with an Angular frontend, FastAPI backend, MongoDB Atlas database, Beanie ODM, Groq AI, Google Calendar API, Gmail SMTP, and APScheduler.

The system supports three user roles:

- **Patient** — searches doctors, books appointments, manages consultations, and receives follow-up information.
- **Doctor** — manages appointments, schedules, leave requests, clinical notes, and prescriptions.
- **Admin** — manages doctors, appointments, and notification records.

The system is designed around preventing appointment conflicts and ensuring that failures in external services such as AI, email, and calendar APIs do not unnecessarily interrupt the main appointment workflow.

---

## 1. Double-Booking Prevention

A major challenge in an appointment booking system is preventing two patients from booking the same doctor at the same time.

CareSync uses multiple validation layers to reduce this risk.

```text
Patient A ──┐
            ├──> Slot Hold Validation ──> Appointment Validation
Patient B ──┘
                        │
                        ▼
                  MongoDB Database
```

When a patient selects a time slot, the backend checks whether the slot is already held or booked.

The booking process uses the doctor ID and appointment start time as the primary identifiers for a slot. Before creating an appointment, the system validates that another active appointment does not already occupy the same doctor and time.

MongoDB acts as the final source of truth. If simultaneous requests attempt to reserve the same slot, database-level validation and duplicate handling prevent conflicting bookings from being accepted.

If a conflict is detected, the API returns an appropriate error response instead of creating multiple appointments for the same slot.

This layered approach ensures that frontend availability checks alone are not trusted, since multiple users can make requests simultaneously.

---

## 2. Slot Hold Mechanism

CareSync uses a temporary slot hold mechanism to prevent a selected appointment slot from being immediately taken by another patient while the first patient completes the booking process.

When a patient selects a slot, the frontend sends a request to:

```
POST /api/patients/slots/hold
```

The backend creates a `SlotHold` document containing information such as:

- Doctor ID
- Appointment start time
- Patient information
- Hold expiration time

The hold is temporary and expires after approximately five minutes.

```text
Select Slot
    │
    ▼
Create SlotHold
    │
    ▼
5-Minute Temporary Reservation
    │
    ├── Booking Completed
    │       │
    │       ▼
    │   Create Appointment
    │   Remove SlotHold
    │
    └── Booking Abandoned
            │
            ▼
       Hold Expires Automatically
```

MongoDB TTL functionality is used to automatically remove expired slot hold records.

This means that if a patient closes the browser or abandons the booking process, the slot eventually becomes available again without requiring manual cleanup.

When the booking is successfully completed, the temporary hold is removed and the permanent appointment record is created.

---

## 3. Doctor Leave Conflict Handling

Doctors can register leave through the doctor portal.

When leave is created, the system stores the information in the `DoctorLeave` collection.

```text
Doctor Requests Leave
        │
        ▼
Create DoctorLeave Record
        │
        ▼
Check Existing Appointments
        │
        ├── No Conflict
        │       │
        │       ▼
        │   Leave Recorded
        │
        └── Existing Appointments
                │
                ▼
        Identify Affected Patients
                │
                ▼
        Generate Notifications
```

The appointment availability system checks doctor leave records before returning available slots.

If a doctor is unavailable on a particular date, the system does not offer appointment slots for that date.

The system also checks for existing appointments that may conflict with the leave period.

Affected patients can then be notified that their appointment may need to be cancelled or rescheduled.

This prevents new bookings from being created during known doctor leave periods while also allowing existing appointment conflicts to be identified.

---

## 4. Notification Failure Handling

CareSync uses Gmail SMTP and `aiosmtplib` for email notifications.

Email notifications are generated for events such as:

- Appointment confirmations
- Appointment reminders
- Appointment changes
- Doctor leave conflicts
- Post-visit follow-up information
- Medication reminders

Each notification is stored in the MongoDB `Notification` collection before or during the delivery process.

```text
Application Event
        │
        ▼
Create Notification Record
        │
        ▼
Send Email
        │
        ├── Success
        │       │
        │       ▼
        │   Status = SENT
        │
        └── Failure
                │
                ▼
          Status = FAILED
                │
                ▼
          Store Error Details
                │
                ▼
          Background Retry Job
```

If email delivery fails, the notification is marked as `FAILED`.

The system stores relevant information such as:

- Recipient email
- Notification type
- Error message
- Retry count
- Notification status

APScheduler runs a background job that periodically checks for failed notifications and attempts to resend them.

This design prevents temporary SMTP or network failures from permanently losing notifications.

Importantly, an email failure does not block the main application workflow. For example, an appointment can still be created successfully even if its confirmation email fails to send.

---

## 5. Supporting Architecture

CareSync follows a client-server architecture.

```text
Angular Frontend
       │
       │ REST API
       ▼
FastAPI Backend
       │
       ├── MongoDB Atlas
       ├── Groq AI
       ├── Google Calendar API
       ├── Gmail SMTP
       └── APScheduler
```

The Angular frontend handles the user interface for patients, doctors, and administrators.

The FastAPI backend manages:

- Authentication and JWT authorization
- Appointment booking
- Slot validation
- Doctor leave management
- Notifications
- AI symptom processing
- Google Calendar integration

MongoDB Atlas stores application data including users, doctor profiles, appointments, temporary slot holds, leave records, medication reminders, and notification logs.

Sensitive configuration such as database credentials, JWT secrets, API keys, Gmail credentials, and Google OAuth credentials is stored using environment variables rather than hardcoded in the application source code.