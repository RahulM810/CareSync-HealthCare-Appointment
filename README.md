# CareSync — Healthcare Appointment & AI Follow-up Platform

CareSync is a full-stack, enterprise-grade healthcare appointment management system featuring **three distinct portals (Patient, Doctor, and Admin)**, **Groq AI-powered symptom triage & clinical summaries**, **two-way Google Calendar synchronization**, **async email notifications via aiosmtplib**, and **background medication compliance reminders**.

Built with **FastAPI (Python async)**, **MongoDB Atlas (Beanie ODM)**, and **Angular 22 (Standalone Signals SPA)**. Deployed 100% on free tiers with zero Redis infrastructure.

---

## 🌟 Key Features

### 👤 Patient Portal
- **Specialist Search & Filtering**: Discover doctors by specialty (Cardiology, Dermatology, Pediatrics, General Medicine, etc.) or name with live next-available slot badges.
- **4-Step Interactive Booking**:
  1. *Date Selection*: Browse up to 14 days in advance.
  2. *Slot Hold Engine*: Clicking a slot locks it for 5 minutes with a live countdown timer (`04:59` &rarr; `00:00`) backed by a MongoDB TTL index.
  3. *AI Symptom Intake*: Enter symptoms and context for immediate Groq AI triage.
  4. *Confirmation*: Real-time validation, Google Calendar event creation, and confirmation emails.
- **Consultation Management**: Filter consultations by status (`Upcoming`, `Completed`, `Cancelled`), reschedule with slot conflict checking, or cancel visits.
- **Care Plan & Prescription Tracking**: View plain-language post-visit physician summaries and structured prescription timetables.

### 🩺 Doctor Portal
- **Live Patient Queue & AI Urgency Triage**: Daily queue with color-coded urgency indicators (🔴 High, 🟡 Medium, 🟢 Low) and pre-visit AI chief complaints.
- **AI Triage Questions**: 3 AI-suggested clinical questions generated per patient symptom log.
- **Physician Evaluation & Prescription Builder**: Dynamic editor to prescribe medications (Dosage, Frequency, Duration, Instructions) that automatically dispatches post-visit emails to patients and sets up hourly compliance reminders.
- **Schedule & Leave Management**: Weekly working hour overview and leave request form that detects affected appointments and dispatches automated notices.

### 👑 Admin Command Center
- **Doctor CRUD**: Add practitioners, set consultation fees, assign room numbers, and deactivate doctors.
- **Global Appointments Directory**: Filterable search across all doctors, patients, dates, and visit statuses.
- **Notification Delivery Telemetry**: Real-time stats (Sent, Queued, Failed) and logs for all email dispatches and APScheduler retries.

---

## 🏗️ Architecture & Free-Tier Tech Stack

| Layer | Technology | Free Tier Provider |
| :--- | :--- | :--- |
| **Frontend** | Angular 22 (Signals, Standalone, Zoneless) + Tailwind CSS | Vercel (Static SPA Build) |
| **Backend** | FastAPI (Python 3.11+, async, Beanie ODM) | Render (Web Service) |
| **Database** | MongoDB Atlas (M0 Cluster) | 512 MB Forever-Free Cluster |
| **LLM Triage** | Groq API (`openai/gpt-oss-20b`) | Free (30 RPM, 14,400 RPD) |
| **Email System** | `aiosmtplib` + Gmail App Password | 500 emails/day |
| **Calendar Sync**| Google Calendar API v3 (`google-auth`) | Free GCP Tier |
| **Background Jobs**| APScheduler + `MongoDBJobStore` | In-Process (No Redis needed) |

---

## 🔒 3-Layer Double-Booking Guard

1. **Layer 1 (MongoDB TTL Hold)**: Ephemeral `SlotHold` with 5-minute TTL index automatically expires abandoned checkouts.
2. **Layer 2 (Optimistic Concurrency Control)**: Versioned atomic checks prevent concurrent modifications.
3. **Layer 3 (Database Partial Unique Index)**: Compound unique index on `(doctor_id, start_time)` filtering non-cancelled bookings stops simultaneous race conditions at the database engine level.

---

## 🚀 Quickstart & Local Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` from `.env.example`:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/healthcare_db?retryWrites=true&w=majority
DB_NAME=healthcare_db
JWT_SECRET=your-256-bit-secret-key-123456
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
GOOGLE_CLIENT_ID=your_gcp_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_gcp_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:4200
```

Seed the database with sample practitioners, patients, and triage records:
```bash
python seed.py
```

Run the unit tests:
```bash
python -m pytest tests/ -v
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build
npm start
```
Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@healthcare.com` | `password123` | Hospital Administrator |
| **Doctor** | `dr.sarah@healthcare.com` | `password123` | Cardiology Specialist |
| **Doctor** | `dr.alex@healthcare.com` | `password123` | General Medicine |
| **Doctor** | `dr.marcus@healthcare.com` | `password123` | Dermatology Specialist |
| **Doctor** | `dr.elena@healthcare.com` | `password123` | Pediatrics Specialist |
| **Patient** | `patient.john@example.com` | `password123` | Active Prescriptions & Visits |
| **Patient** | `patient.emma@example.com` | `password123` | Patient Profile |

---

## 📡 REST API Catalog

### Authentication
- `POST /api/auth/register` — Register patient account
- `POST /api/auth/login` — Sign in & obtain Bearer JWT
- `GET /api/auth/me` — Current authenticated user profile
- `GET /api/auth/google` — Google OAuth consent initiation URL
- `GET /api/auth/google/callback` — Google OAuth callback & token storage

### Patients
- `GET /api/patients/doctors` — Search doctors with specialty & keyword query
- `GET /api/patients/doctors/{id}` — Doctor details + next available slot
- `GET /api/patients/doctors/{id}/slots?date=YYYY-MM-DD` — Real-time slot availability
- `POST /api/patients/slots/hold` — Place 5-minute temporary hold on slot
- `POST /api/patients/appointments` — Atomic appointment booking with Groq AI triage
- `GET /api/patients/appointments` — List my consultations
- `GET /api/patients/appointments/{id}` — Consultation detail & clinical care plan
- `PUT /api/patients/appointments/{id}/cancel` — Cancel consultation
- `PUT /api/patients/appointments/{id}/reschedule` — Reschedule consultation

### Doctors
- `GET /api/doctors/dashboard` — Today's queue with AI urgency badges (🔴🟡🟢)
- `GET /api/doctors/appointments` — Doctor's consultation history
- `GET /api/doctors/appointments/{id}` — Consultation detail & AI triage questions
- `POST /api/doctors/appointments/{id}/notes` — Submit clinical notes & prescriptions
- `GET /api/doctors/schedule` — Weekly working hours & leave calendar
- `POST /api/doctors/leave` — Record planned leave and notify affected patients

### Admin
- `GET /api/admin/doctors` — List all clinic doctors
- `POST /api/admin/doctors` — Create practitioner profile
- `PUT /api/admin/doctors/{id}` — Update doctor profile
- `DELETE /api/admin/doctors/{id}` — Deactivate doctor
- `GET /api/admin/appointments` — System-wide appointments directory
- `GET /api/admin/notifications` — Real-time email delivery stats and logs

---

## 🚢 Free Tier Deployment

### 1. Backend on Render (Web Service)
1. Link your GitHub repository to [Render](https://render.com).
2. Environment: `Python 3`.
3. Build Command: `pip install -r requirements.txt`.
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add environment variables from `.env.example`.

### 2. Frontend on Vercel
1. Link your repository to [Vercel](https://vercel.com).
2. Framework Preset: `Angular`.
3. Build Command: `ng build`.
4. Output Directory: `dist/healthcare-frontend/browser` (or `dist/frontend`).
5. Set `apiUrl` in `environment.prod.ts` to your Render backend URL.
