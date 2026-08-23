# CareSync Healthcare Platform — System Design & Architecture

CareSync is a full-stack healthcare appointment and follow-up platform architected with **FastAPI**, **MongoDB Atlas (via Beanie ODM)**, **Groq AI (GPT OSS 20B)**, **Google Calendar API**, and an **Angular 22** client. It is engineered to operate 100% on free tiers with zero Redis/broker infrastructure while maintaining strict ACID-like transactional reliability.

---

## 1. 3-Layer Double-Booking Prevention & Slot Hold Engine

A primary failure mode in healthcare platforms is race conditions: two patients booking the same doctor slot simultaneously. CareSync implements a defense-in-depth, three-layer concurrency control model:

```
[ Patient Selects Slot ] ──> Layer 1: SlotHold with 5-Min MongoDB TTL Index
                                     │ (DuplicateKey Error -> 409 Conflict)
                                     ▼
[ Patient Enters Symptoms ] ─> Layer 2: Optimistic Concurrency Control (version=1)
                                     │ (Checks version atomicity)
                                     ▼
[ Confirm Appointment ] ─────> Layer 3: Partial Unique Index on MongoDB
                                     (doctor_id, start_time) where status ∉ {CANCELLED}
                                     │
                                     ├─► Success: SlotHold Deleted, Side Effects Queued
                                     └─► DuplicateKeyError: Returns 409 "Slot already booked"
```

### Layer 1: Ephemeral Slot Hold with MongoDB TTL Indexes
When a patient clicks an available slot, the client invokes `POST /api/patients/slots/hold`.
- The server attempts to insert a `SlotHold` document with `expires_at = datetime.utcnow() + 5 minutes`.
- The collection features a compound unique index on `(doctor_id, start_time)` and a MongoDB TTL index on `expires_at` (`expireAfterSeconds: 0`).
- If another patient has already placed a hold on that slot, MongoDB immediately rejects the second insertion with `DuplicateKeyError` (translated to HTTP 409 Conflict).
- If the patient abandons the checkout flow or closes the tab, the MongoDB background TTL reaper automatically evicts the hold document after 300 seconds, releasing the slot without requiring an active server cleanup job.

### Layer 2: Optimistic Concurrency Control (OCC)
- Every `Appointment` document includes an integer `version` field (initialized at `1`).
- Rescheduling operations perform conditional updates (`find_one_and_update` matching `id` and `version`). If the version has advanced, the update fails, preventing lost updates during simultaneous modifications.

### Layer 3: Database-Level Partial Unique Index
- Even if two requests bypass Layer 1 due to simultaneous hold expirations, the core `appointments` collection enforces a unique compound index:
  ```json
  {
    "doctor_id": 1,
    "start_time": 1
  },
  {
    "unique": true,
    "partialFilterExpression": {
      "status": { "$in": ["HELD", "CONFIRMED", "COMPLETED"] }
    }
  }
  ```
- Cancelled appointments (`status = "CANCELLED"`) are excluded from the uniqueness constraint, allowing cancelled slots to be freely rebooked by other patients while maintaining audit history.

---

## 2. Doctor Leave Management & Slot Invalidation

When a doctor or clinic administrator records a leave day (`POST /api/doctors/leave`):
1. **Immediate Invalidation**: The `SlotService` checks the `DoctorLeave` collection before computing availability. Any date matching an active leave returns an empty slot array `[]`.
2. **Affected Consultation Detection**: The query locates all existing appointments on that date with `status == "CONFIRMED"`.
3. **Automated Patient Alerting**: An asynchronous task dispatches personalized `leave_conflict.html` email notices to all affected patients, explaining that their practitioner will be away and inviting them to select an alternative slot through the portal at no additional charge.

---

## 3. LLM Graceful Degradation & Non-Blocking Triage

CareSync integrates Groq's high-speed LLM endpoint (`openai/gpt-oss-20b`) for two clinical workflows:
1. **Pre-Visit Symptom Triage**: Extracts chief complaint, classifies urgency into `High`, `Medium`, or `Low`, and prepares three targeted diagnostic questions for the doctor.
2. **Post-Visit Patient Summary**: Translates dense physician clinical notes and prescriptions into plain, empathetic patient language with a structured medication timetable.

### Failure-Proof Resilience Architecture
LLM API calls are inherently nondeterministic and subject to rate limits or latency spikes. The booking and notes-submission pipelines **never block on LLM failures**:
- **Timeout & Retry**: Groq API calls are wrapped in a 10-second timeout with one automatic retry (2-second backoff).
- **Rule-Based Heuristic Fallback**: If the Groq endpoint is unreachable or credentials are unconfigured, a deterministic fallback analyzes symptom keywords (e.g., chest pain, respiratory distress, fever) to assign a baseline urgency level.
- **Audit Flagging**: Documents record `pre_visit_llm_failed: true` or `post_visit_llm_failed: true`, allowing administrators to view telemetry and re-run triage if necessary.

---

## 4. Notification Reliability & In-Process APScheduler

To avoid requiring an external Redis broker or separate Celery workers on free hosting tiers, CareSync utilizes **APScheduler** backed by **MongoDBJobStore**:
- **Persistence Across Restarts**: Background job states and cron schedules (`appointment_reminders`, `medication_reminders`, `retry_failed_emails`) are persisted in the `apscheduler_jobs` collection in the same Atlas cluster.
- **Exponential Retry Mechanism**: Every dispatched email is tracked in the `notifications` collection. If the SMTP transport fails, the `retry_failed_emails` cron job re-attempts delivery with exponential backoff up to 5 times.
- **Medication Compliance Reminders**: When clinical notes contain prescriptions, daily medication reminder records are created and evaluated hourly against active treatment windows.

---

## 5. Google Calendar Two-Way Synchronization

- Patients and doctors can connect their Google accounts via OAuth2 with `https://www.googleapis.com/auth/calendar.events` scope.
- Upon appointment confirmation, CareSync creates a Google Calendar event containing consultation room, doctor credentials, and symptom notes.
- Event updates (`PATCH`) occur automatically on reschedule, and event deletions (`DELETE`) occur automatically upon appointment cancellation.
- Calendar sync operations run asynchronously in background tasks, ensuring external Google API errors never disrupt booking finalization.
