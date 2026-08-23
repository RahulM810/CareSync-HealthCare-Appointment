import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Doctor,
  SlotItem,
  HoldSlotResponse,
  Appointment,
  DoctorLeave,
  NotificationStats,
  PrescriptionItem
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ==========================================
  // PATIENT ENDPOINTS
  // ==========================================
  getDoctors(specialisation?: string, search?: string): Observable<Doctor[]> {
    let params = new HttpParams();
    if (specialisation) params = params.set('specialisation', specialisation);
    if (search) params = params.set('search', search);
    return this.http.get<Doctor[]>(`${this.baseUrl}/patients/doctors`, { params });
  }

  getDoctor(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.baseUrl}/patients/doctors/${id}`);
  }

  getDoctorSlots(doctorId: string, dateStr: string): Observable<SlotItem[]> {
    const params = new HttpParams().set('date', dateStr);
    return this.http.get<SlotItem[]>(`${this.baseUrl}/patients/doctors/${doctorId}/slots`, { params });
  }

  holdSlot(doctorId: string, startTime: string): Observable<HoldSlotResponse> {
    return this.http.post<HoldSlotResponse>(`${this.baseUrl}/patients/slots/hold`, {
      doctor_id: doctorId,
      start_time: startTime
    });
  }

  bookAppointment(payload: { doctor_id: string; start_time: string; symptoms: string }): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/patients/appointments`, payload);
  }

  getPatientAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patients/appointments`);
  }

  getPatientAppointmentDetail(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/patients/appointments/${id}`);
  }

  cancelPatientAppointment(id: string): Observable<{ message: string; status: string }> {
    return this.http.put<{ message: string; status: string }>(`${this.baseUrl}/patients/appointments/${id}/cancel`, {});
  }

  reschedulePatientAppointment(id: string, newStartTime: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/patients/appointments/${id}/reschedule`, {
      new_start_time: newStartTime
    });
  }

  // ==========================================
  // DOCTOR ENDPOINTS
  // ==========================================
  getDoctorDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctors/dashboard`);
  }

  getDoctorAppointments(status?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctors/appointments`, { params });
  }

  getDoctorAppointmentDetail(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/doctors/appointments/${id}`);
  }

  submitClinicalNotes(
    id: string,
    notes: string,
    prescriptions: PrescriptionItem[]
  ): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/doctors/appointments/${id}/notes`, {
      clinical_notes: notes,
      prescriptions
    });
  }

  getDoctorSchedule(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctors/schedule`);
  }

  requestDoctorLeave(payload: { leave_date: string; reason?: string }): Observable<DoctorLeave> {
    return this.http.post<DoctorLeave>(`${this.baseUrl}/doctors/leave`, payload);
  }

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  getAdminDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/admin/doctors`);
  }

  createDoctor(payload: any): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.baseUrl}/admin/doctors`, payload);
  }

  getAdminDoctor(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.baseUrl}/admin/doctors/${id}`);
  }

  updateDoctor(id: string, payload: any): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.baseUrl}/admin/doctors/${id}`, payload);
  }

  deactivateDoctor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/doctors/${id}`);
  }

  getDoctorLeaves(doctorId: string): Observable<DoctorLeave[]> {
    return this.http.get<DoctorLeave[]>(`${this.baseUrl}/admin/doctors/${doctorId}/leave`);
  }

  createDoctorLeave(doctorId: string, payload: { leave_date: string; reason?: string }): Observable<DoctorLeave> {
    return this.http.post<DoctorLeave>(`${this.baseUrl}/admin/doctors/${doctorId}/leave`, payload);
  }

  cancelDoctorLeave(doctorId: string, leaveId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/doctors/${doctorId}/leave/${leaveId}`);
  }

  getAdminAppointments(status?: string, doctorId?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (doctorId) params = params.set('doctor_id', doctorId);
    return this.http.get<Appointment[]>(`${this.baseUrl}/admin/appointments`, { params });
  }

  getAdminNotifications(): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.baseUrl}/admin/notifications`);
  }

  // ==========================================
  // CALENDAR ENDPOINTS
  // ==========================================
  getCalendarConnectUrl(): Observable<{ oauth_url: string }> {
    return this.http.get<{ oauth_url: string }>(`${this.baseUrl}/calendar/connect`);
  }

  getCalendarStatus(): Observable<{ connected: boolean; email: string }> {
    return this.http.get<{ connected: boolean; email: string }>(`${this.baseUrl}/calendar/status`);
  }

  disconnectCalendar(): Observable<any> {
    return this.http.post(`${this.baseUrl}/calendar/disconnect`, {});
  }
}
