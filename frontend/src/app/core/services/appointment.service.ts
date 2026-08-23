import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Doctor {
  id: string;
  user_id: string;
  specialisation: string;
  bio?: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: 'HELD' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  symptoms: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${environment.apiUrl}/doctors`);
  }

  holdSlot(payload: { doctor_id: string; start_time: string }) {
    return this.http.post<{ hold_id: string; expires_at: string }>(
      `${environment.apiUrl}/appointments/hold`,
      payload
    );
  }

  confirmAppointment(payload: { hold_id: string; symptoms: string }) {
    return this.http.post<Appointment>(
      `${environment.apiUrl}/appointments/confirm`,
      payload
    );
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments/me`);
  }
}