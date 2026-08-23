import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Appointment } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Consultations History</h1>
        <p class="text-sm text-slate-500 mt-1">Full registry of your patient visits, AI triage summaries, and prescriptions</p>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading consultations..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading() && appointments().length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200">
        <p class="text-sm font-bold text-slate-700">No consultations found in your history</p>
      </div>

      <div *ngIf="!loading() && appointments().length > 0" class="space-y-4">
        <div *ngFor="let appt of appointments()"
             class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-300 transition">
          
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                    [ngClass]="{
                      'bg-blue-100 text-blue-800': appt.status === 'CONFIRMED',
                      'bg-emerald-100 text-emerald-800': appt.status === 'COMPLETED',
                      'bg-rose-100 text-rose-800': appt.status === 'CANCELLED'
                    }">
                {{ appt.status }}
              </span>

              <app-urgency-badge *ngIf="appt.pre_visit_summary" [level]="appt.pre_visit_summary.urgency_level"></app-urgency-badge>
            </div>

            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ appt.patient_name }}</h3>
              <p class="text-xs text-slate-400">{{ appt.patient_email }}</p>
            </div>

            <p class="text-xs text-slate-600">
              <strong>{{ appt.start_time | date:'EEEE, MMM d, y' }}</strong> at {{ appt.start_time | date:'h:mm a' }}
            </p>

            <p class="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              Chief Concern: "{{ appt.symptoms }}"
            </p>
          </div>

          <div class="shrink-0">
            <a [routerLink]="['/doctor/appointments', appt.id]"
               class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-block">
              Open Consultation Form
            </a>
          </div>

        </div>
      </div>
    </div>
  `
})
export class DoctorAppointmentsComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);

  ngOnInit() {
    this.api.getDoctorAppointments().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.appointments.set(list);
      },
      error: () => this.loading.set(false)
    });
  }
}
