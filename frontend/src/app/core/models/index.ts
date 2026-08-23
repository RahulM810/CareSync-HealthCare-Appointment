export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type AppointmentStatus = 'HELD' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone_number?: string;
  google_calendar_connected?: boolean;
}

export interface WorkingHours {
  day_of_week: number;
  start_hour: number;
  end_hour: number;
  is_working: boolean;
}

export interface Doctor {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  specialisation: string;
  bio?: string;
  consultation_fee: number;
  slot_duration_minutes: number;
  room_number?: string;
  is_active: boolean;
  working_hours: WorkingHours[];
  next_available_slot?: string;
}

export interface SlotItem {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface HoldSlotResponse {
  hold_id: string;
  doctor_id: string;
  start_time: string;
  expires_at: string;
  message: string;
}

export interface PreVisitSummary {
  urgency_level: UrgencyLevel;
  chief_complaint: string;
  suggested_questions: string[];
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_specialisation?: string;
  patient_id: string;
  patient_name?: string;
  patient_email?: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  symptoms: string;
  pre_visit_summary?: PreVisitSummary;
  pre_visit_llm_failed?: boolean;
  clinical_notes?: string;
  post_visit_summary?: string;
  post_visit_llm_failed?: boolean;
  prescriptions: PrescriptionItem[];
  google_calendar_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  leave_date: string;
  reason?: string;
  affected_appointments: number;
}

export interface NotificationLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  notification_type: string;
  subject: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  retry_count: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  sent: number;
  queued: number;
  failed: number;
  recent_logs: NotificationLog[];
}
