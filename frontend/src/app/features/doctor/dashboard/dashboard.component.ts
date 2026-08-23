import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';
import { DoctorNamePipe } from '../../../shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent, DoctorNamePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Doctor Banner -->
      <div class="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
            Clinical Portal & AI Triage
          </span>
          <h1 class="text-3xl font-extrabold tracking-tight">Today's Patient Queue</h1>
          <p class="text-slate-400 text-xs sm:text-sm mt-1">
            Doctor: <strong class="text-white">{{ auth.currentUser()?.full_name | doctorName }}</strong>
          </p>
        </div>

        <!-- Urgency Breakdown Badges -->
        <div class="flex items-center gap-3">
          <div class="bg-red-500/20 border border-red-500/40 px-3.5 py-2 rounded-2xl text-center">
            <span class="text-xs text-red-300 font-bold block">🔴 High</span>
            <strong class="text-xl font-extrabold text-red-200">{{ urgencyCounts().High || 0 }}</strong>
          </div>
          <div class="bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 rounded-2xl text-center">
            <span class="text-xs text-amber-300 font-bold block">🟡 Medium</span>
            <strong class="text-xl font-extrabold text-amber-200">{{ urgencyCounts().Medium || 0 }}</strong>
          </div>
          <div class="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 rounded-2xl text-center">
            <span class="text-xs text-emerald-300 font-bold block">🟢 Low</span>
            <strong class="text-xl font-extrabold text-emerald-200">{{ urgencyCounts().Low || 0 }}</strong>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()">
        <app-loading-spinner message="Loading today's clinical queue..."></app-loading-spinner>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && appointments().length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">No scheduled appointments for today</h3>
        <p class="text-xs text-slate-400 mt-1">All consultations for today have either concluded or none were booked.</p>
      </div>

      <!-- Today's Queue List -->
      <div *ngIf="!loading() && appointments().length > 0" class="space-y-4">
        <div *ngFor="let item of appointments()"
             class="bg-white rounded-3xl border p-6 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
             [ngClass]="{
               'border-red-300 bg-red-50/10': item.urgency_level === 'High',
               'border-amber-300 bg-amber-50/10': item.urgency_level === 'Medium',
               'border-slate-200': item.urgency_level === 'Low' || !item.urgency_level
             }">
          
          <div class="space-y-2.5 flex-1">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                {{ item.start_time | date:'h:mm a' }} – {{ item.end_time | date:'h:mm a' }}
              </span>
              <app-urgency-badge [level]="item.urgency_level"></app-urgency-badge>

              <span *ngIf="item.has_notes" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                ✓ Notes Recorded
              </span>
            </div>

            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ item.patient_name }}</h3>
              <p class="text-xs text-slate-400">{{ item.patient_email }}</p>
            </div>

            <!-- AI Chief Complaint Triage -->
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
              <p class="font-bold text-slate-700 mb-0.5 flex items-center gap-1.5">
                <span class="text-brand-600">⚡ AI Triage:</span>
                <span>{{ item.chief_complaint }}</span>
              </p>
              <p class="text-slate-500 italic mt-1">
                Symptoms: "{{ item.symptoms }}"
              </p>
            </div>
          </div>

          <!-- Action Button -->
          <div class="shrink-0">
            <a [routerLink]="['/doctor/appointments', item.id]"
               class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2">
              <span>{{ item.has_notes ? 'Review Clinical Notes' : 'Start Consultation' }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

        </div>
      </div>

    </div>
  `
})
export class DoctorDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading = signal(true);
  appointments = signal<any[]>([]);
  urgencyCounts = signal<{ High: number; Medium: number; Low: number }>({ High: 0, Medium: 0, Low: 0 });

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.api.getDoctorDashboard().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.appointments.set(data.appointments || []);
        this.urgencyCounts.set(data.urgency_counts || { High: 0, Medium: 0, Low: 0 });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
