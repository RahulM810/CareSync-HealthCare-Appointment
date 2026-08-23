import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';
import { DoctorNamePipe } from '../../../shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent, DoctorNamePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Top Welcome Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 text-white p-8 sm:p-10 shadow-xl shadow-brand-700/20 mb-8">
        <div class="relative z-10 max-w-2xl">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-3">
            ✨ AI-Powered Healthcare
          </span>
          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Hello, {{ auth.currentUser()?.full_name || 'Patient' }}!
          </h1>
          <p class="mt-2 text-brand-100 text-sm sm:text-base leading-relaxed">
            Manage your medical consultations, receive real-time symptom triage, and synchronize seamlessly with Google Calendar.
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/patient/doctors"
               class="px-5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Book New Appointment
            </a>
            <a routerLink="/patient/appointments"
               class="px-5 py-2.5 bg-brand-800/60 hover:bg-brand-800 text-white font-semibold text-sm rounded-xl backdrop-blur-sm border border-white/20 transition">
              View All Appointments
            </a>
          </div>
        </div>

        <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Visits</p>
            <h3 class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ upcomingCount() }}</h3>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Visits</p>
            <h3 class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ completedCount() }}</h3>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Calendar</p>
            <h3 class="text-base font-bold text-slate-800 dark:text-white mt-2 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" [ngClass]="isCalendarSynced() ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'"></span>
              {{ isCalendarSynced() ? 'Connected' : 'Not Linked' }}
            </h3>
          </div>
          <button (click)="toggleCalendarSync()"
                  [title]="isCalendarSynced() ? 'Calendar active' : 'Click to connect Google Calendar'"
                  class="px-3 py-1.5 text-xs font-bold rounded-lg border transition"
                  [ngClass]="isCalendarSynced() ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40' : 'border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40'">
            {{ isCalendarSynced() ? 'Synced' : 'Connect' }}
          </button>
        </div>

      </div>

      <!-- Upcoming Appointments Section -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8 transition-colors">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Next Scheduled Consultations</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your upcoming appointments with doctors</p>
          </div>
          <a routerLink="/patient/doctors" class="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700">
            + Schedule Another
          </a>
        </div>

        <div *ngIf="loading()">
          <app-loading-spinner message="Loading your appointments..."></app-loading-spinner>
        </div>

        <div *ngIf="!loading() && upcomingAppointments().length === 0" class="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 class="text-sm font-bold text-slate-800 dark:text-white">No upcoming appointments scheduled</h4>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">Find a certified doctor by specialization and book in under 2 minutes.</p>
          <a routerLink="/patient/doctors" class="inline-flex px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition">
            Browse Doctors Directory
          </a>
        </div>

        <!-- Appointment Cards -->
        <div *ngIf="!loading() && upcomingAppointments().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let appt of upcomingAppointments()"
               class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h4 class="text-base font-bold text-slate-900 dark:text-white">{{ appt.doctor_name | doctorName }}</h4>
                  <span class="text-xs font-semibold text-brand-600 dark:text-brand-400">{{ appt.doctor_specialisation }}</span>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                  {{ appt.status }}
                </span>
              </div>

              <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <p class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <strong class="text-slate-800 dark:text-slate-200">{{ appt.start_time | date:'EEEE, MMM d, y' }}</strong>
                </p>
                <p class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ appt.start_time | date:'h:mm a' }} – {{ appt.end_time | date:'h:mm a' }}</span>
                </p>
                <p class="text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1">
                  "{{ appt.symptoms }}"
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <a [routerLink]="['/patient/appointments', appt.id]"
                 class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1">
                View Full Details & AI Summary
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class PatientDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);

  upcomingAppointments = signal<Appointment[]>([]);
  upcomingCount = signal(0);
  completedCount = signal(0);
  isCalendarSynced = signal(false);

  ngOnInit() {
    this.loadAppointments();
    this.isCalendarSynced.set(!!this.auth.currentUser()?.google_calendar_connected);
  }

  loadAppointments() {
    this.loading.set(true);
    this.api.getPatientAppointments().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.appointments.set(list);

        const upcoming = list.filter(a => a.status === 'CONFIRMED' || a.status === 'HELD');
        const completed = list.filter(a => a.status === 'COMPLETED');

        this.upcomingAppointments.set(upcoming);
        this.upcomingCount.set(upcoming.length);
        this.completedCount.set(completed.length);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleCalendarSync() {
    this.api.getCalendarConnectUrl().subscribe({
      next: (res) => {
        if (res.oauth_url) {
          window.location.href = res.oauth_url;
        }
      },
      error: () => {
        this.notifications.info('Calendar integration uses Google OAuth. Please sign in with Google or authorize Calendar permissions.');
      }
    });
  }
}
