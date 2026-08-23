# CareSync — Healthcare Appointment & AI Follow-up Platform

CareSync is a full-stack healthcare appointment management platform featuring separate **Patient, Doctor, and Admin portals**, AI-powered symptom triage and clinical summaries, Google Calendar integration, email notifications, and automated medication reminders.

Built with **Angular**, **FastAPI**, **MongoDB Atlas**, and **Groq AI**, CareSync is deployed using free-tier cloud services.

## 🌐 Live Demo

- **Frontend:** https://caresync-frontend-ten.vercel.app
- **Backend API:** https://caresync-backend-ppxv.onrender.com
- **API Health Check:** https://caresync-backend-ppxv.onrender.com/api/health

---

# 🌟 Key Features

## 👤 Patient Portal

- Search and filter doctors by specialty or name.
- View available appointment slots.
- Book appointments through a multi-step booking process.
- Temporary slot holding to reduce double booking.
- AI-powered symptom intake and urgency estimation.
- View upcoming, completed, and cancelled appointments.
- Reschedule or cancel appointments.
- View prescriptions and post-visit summaries.
- Google Calendar appointment integration.
- Email notifications and reminders.

## 🩺 Doctor Portal

- View daily patient appointments.
- AI-generated urgency indicators and symptom summaries.
- AI-suggested questions based on patient symptoms.
- Add clinical notes and prescriptions.
- Generate patient-friendly post-visit summaries.
- Manage schedules and leave.
- Notify affected patients when appointments are impacted.

## 👑 Admin Portal

- Manage doctor profiles.
- Create, update, and deactivate doctors.
- View system-wide appointments.
- Monitor notification logs and delivery status.
- Manage healthcare platform users and appointments.

---

# 🤖 AI Features

CareSync integrates the **Groq API** for AI-assisted healthcare workflows.

### Pre-Visit AI Triage

Patient symptoms are analyzed to generate:

- Urgency level: Low, Medium, or High.
- Chief complaint summary.
- Three suggested questions for the doctor.

### Post-Visit Summary

Clinical notes are converted into a patient-friendly summary containing:

- Plain-language diagnosis explanation.
- Medication instructions.
- Follow-up recommendations.
- Warning signs and next steps.

Fallback logic is included if the AI service is unavailable.

---

# 🏗️ Tech Stack

| Layer | Technology | Deployment |
|---|---|---|
| Frontend | Angular + TypeScript | Vercel |
| Backend | FastAPI + Python | Render |
| Database | MongoDB Atlas + Beanie ODM | MongoDB Atlas |
| Authentication | JWT + HTTP Bearer | FastAPI |
| AI | Groq API | Groq |
| Email | Gmail SMTP + aiosmtplib | Gmail |
| Calendar | Google Calendar API | Google Cloud |
| Background Jobs | APScheduler | Render |
| ODM | Beanie + Motor | MongoDB |

---

# 🔒 Appointment Protection

CareSync includes multiple mechanisms to help prevent appointment conflicts.

1. **Temporary Slot Hold**  
   Selected appointment slots can be temporarily held before booking.

2. **Conflict Validation**  
   Appointment availability is checked before confirming a booking.

3. **Database-Level Protection**  
   Appointment data is validated to reduce duplicate or conflicting bookings.

---

# 📂 Project Structure

```text
CareSync-HealthCare-Appointment/
│
├── backend/
│   ├── app/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   └── environments/
│   ├── package.json
│   └── angular.json
│
├── Dockerfile
├── .gitignore
└── README.md