import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment, AppointmentStatus } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';
import { DoctorNamePipe } from '../../../shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent, DoctorNamePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">My Consultations</h1>
          <p class="text-sm text-slate-500 mt-1">Review scheduled appointments, clinical summaries, and treatment plans</p>
        </div>
        <a routerLink="/patient/doctors"
           class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2">
          + Book New Consultation
        </a>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button *ngFor="let tab of tabs"
                (click)="setFilter(tab.key)"
                class="px-4 py-2 rounded-xl text-xs font-bold transition"
                [ngClass]="activeFilter() === tab.key ? 'bg-brand-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'">
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()">
        <app-loading-spinner message="Loading your consultations..."></app-loading-spinner>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && filteredAppointments().length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">No appointments found</h3>
        <p class="text-xs text-slate-400 mt-1 mb-4">No appointments matching the selected filter status.</p>
      </div>

      <!-- Appointments List -->
      <div *ngIf="!loading() && filteredAppointments().length > 0" class="space-y-4">
        <div *ngFor="let appt of filteredAppointments()"
             class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-brand-300 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                    [ngClass]="{
                      'bg-blue-100 text-blue-800': appt.status === 'CONFIRMED' || appt.status === 'HELD',
                      'bg-emerald-100 text-emerald-800': appt.status === 'COMPLETED',
                      'bg-rose-100 text-rose-800': appt.status === 'CANCELLED'
                    }">
                {{ appt.status }}
              </span>

              <app-urgency-badge *ngIf="appt.pre_visit_summary" [level]="appt.pre_visit_summary.urgency_level"></app-urgency-badge>

              <span *ngIf="appt.google_calendar_synced" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Google Synced
              </span>
            </div>

            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ appt.doctor_name | doctorName }}</h3>
              <p class="text-xs font-semibold text-brand-600">{{ appt.doctor_specialisation }}</p>
            </div>

            <p class="text-xs text-slate-600 flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <strong>{{ appt.start_time | date:'EEEE, MMMM d, y' }}</strong> at {{ appt.start_time | date:'h:mm a' }}
            </p>

            <p class="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              "{{ appt.symptoms }}"
            </p>
          </div>

          <!-- Actions -->
          <div class="flex md:flex-col gap-2 shrink-0">
            <a [routerLink]="['/patient/appointments', appt.id]"
               class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center">
              View Details
            </a>

            <button *ngIf="appt.status === 'CONFIRMED' || appt.status === 'HELD'"
                    (click)="cancelAppointment(appt.id)"
                    class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition text-center">
              Cancel Visit
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class PatientAppointmentsComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);
  filteredAppointments = signal<Appointment[]>([]);
  activeFilter = signal<string>('ALL');

  tabs = [
    { key: 'ALL', label: 'All Consultations' },
    { key: 'CONFIRMED', label: 'Upcoming' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' }
  ];

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading.set(true);
    this.api.getPatientAppointments().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.appointments.set(list);
        this.applyFilter();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setFilter(status: string) {
    this.activeFilter.set(status);
    this.applyFilter();
  }

  applyFilter() {
    const f = this.activeFilter();
    if (f === 'ALL') {
      this.filteredAppointments.set(this.appointments());
    } else {
      this.filteredAppointments.set(this.appointments().filter(a => a.status === f));
    }
  }

  cancelAppointment(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment? An email notification will be sent.')) return;

    this.api.cancelPatientAppointment(id).subscribe({
      next: () => {
        this.notifications.success('Appointment cancelled.');
        this.loadAppointments();
      },
      error: (err) => {
        this.notifications.error(err.error?.detail || 'Could not cancel appointment.');
      }
    });
  }
}
