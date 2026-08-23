import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';
import { DoctorNamePipe } from '../../../shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-patient-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent, DoctorNamePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="mb-6">
        <a routerLink="/patient/appointments" class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Appointments
        </a>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Consultation Details</h1>
            <p class="text-xs text-slate-500 mt-1">Appointment ID: {{ appointmentId }}</p>
          </div>

          <div *ngIf="appointment()" class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="{
                    'bg-blue-100 text-blue-800': appointment()?.status === 'CONFIRMED' || appointment()?.status === 'HELD',
                    'bg-emerald-100 text-emerald-800': appointment()?.status === 'COMPLETED',
                    'bg-rose-100 text-rose-800': appointment()?.status === 'CANCELLED'
                  }">
              {{ appointment()?.status }}
            </span>

            <app-urgency-badge *ngIf="appointment()?.pre_visit_summary"
                               [level]="appointment()?.pre_visit_summary?.urgency_level || 'Low'">
            </app-urgency-badge>
          </div>
        </div>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading consultation record..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading() && appointment()" class="space-y-6">

        <!-- 1. Doctor & Schedule Card -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="space-y-3">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor Information</p>
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ appointment()?.doctor_name | doctorName }}</h3>
              <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 mt-1">
                {{ appointment()?.doctor_specialisation }}
              </span>
            </div>
            <p class="text-xs text-slate-600">Location: Main Clinic, Consultation Suite</p>
          </div>

          <div class="space-y-3 sm:border-l sm:border-slate-100 sm:pl-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Timing</p>
            <p class="text-sm font-bold text-slate-800">
              {{ appointment()?.start_time | date:'EEEE, MMMM d, y' }}
            </p>
            <p class="text-xs text-slate-600">
              {{ appointment()?.start_time | date:'h:mm a' }} – {{ appointment()?.end_time | date:'h:mm a' }} (30 mins)
            </p>
            <div *ngIf="appointment()?.google_calendar_synced" class="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Synced with Google Calendar
            </div>
          </div>
        </div>

        <!-- 2. Patient Symptoms & AI Pre-visit Triage -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">Reported Symptoms & AI Triage</h3>
            <span class="text-xs font-semibold text-brand-600">Groq AI Powered</span>
          </div>

          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <p class="font-semibold text-slate-500 mb-1">Patient Chief Concern:</p>
            <p class="text-slate-800 italic">"{{ appointment()?.symptoms }}"</p>
          </div>

          <div *ngIf="appointment()?.pre_visit_summary" class="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 text-xs space-y-2">
            <p class="font-bold text-brand-900">AI Clinical Summary:</p>
            <p class="text-brand-800">{{ appointment()?.pre_visit_summary?.chief_complaint }}</p>
          </div>
        </div>

        <!-- 3. Post-Visit Summary & Prescription (if Completed) -->
        <div *ngIf="appointment()?.status === 'COMPLETED'" class="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-6">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Care Plan & Diagnosis
            </span>
            <h3 class="text-xl font-bold text-slate-900 mt-2">Doctor's Clinical Summary</h3>
          </div>

          <!-- Plain-Language Patient Summary -->
          <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
            {{ appointment()?.post_visit_summary }}
          </div>

          <!-- Prescriptions Table -->
          <div *ngIf="appointment()?.prescriptions && appointment()?.prescriptions!.length > 0">
            <h4 class="text-sm font-bold text-slate-900 mb-3">Prescribed Medications</h4>
            
            <div class="overflow-x-auto rounded-2xl border border-slate-200">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th class="py-3 px-4">Medicine</th>
                    <th class="py-3 px-4">Dosage</th>
                    <th class="py-3 px-4">Frequency</th>
                    <th class="py-3 px-4">Duration</th>
                    <th class="py-3 px-4">Instructions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr *ngFor="let rx of appointment()?.prescriptions" class="hover:bg-slate-50/60">
                    <td class="py-3 px-4 font-bold text-slate-900">{{ rx.medicine }}</td>
                    <td class="py-3 px-4">{{ rx.dosage }}</td>
                    <td class="py-3 px-4">{{ rx.frequency }}</td>
                    <td class="py-3 px-4">{{ rx.duration_days }} days</td>
                    <td class="py-3 px-4 text-slate-500 italic">{{ rx.instructions || 'With food' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class PatientAppointmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  appointmentId: string = '';
  appointment = signal<Appointment | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDetail();
  }

  loadDetail() {
    this.loading.set(true);
    this.api.getPatientAppointmentDetail(this.appointmentId).subscribe({
      next: (appt) => {
        this.loading.set(false);
        this.appointment.set(appt);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
