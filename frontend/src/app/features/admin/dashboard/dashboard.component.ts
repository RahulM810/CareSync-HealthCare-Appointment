import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationStats } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Admin Header -->
      <div class="rounded-3xl bg-gradient-to-r from-purple-900 via-slate-900 to-brand-950 text-white p-8 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
            👑 Hospital Administration
          </span>
          <h1 class="text-3xl font-extrabold tracking-tight">Platform Command Center</h1>
          <p class="text-slate-400 text-xs sm:text-sm mt-1">
            Monitor doctors, system appointments, and background notification queues
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a routerLink="/admin/doctors"
             class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition">
            Manage Doctors
          </a>
          <a routerLink="/admin/appointments"
             class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition">
            All Appointments
          </a>
        </div>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading system metrics..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading()" class="space-y-8">
        
        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
          
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Doctors</p>
            <h3 class="text-3xl font-extrabold text-slate-900 mt-2">{{ doctorCount() }}</h3>
            <span class="text-[11px] font-semibold text-emerald-600 mt-1 inline-block">100% Operational</span>
          </div>

          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Appointments</p>
            <h3 class="text-3xl font-extrabold text-brand-700 mt-2">{{ appointmentCount() }}</h3>
            <span class="text-[11px] font-semibold text-brand-600 mt-1 inline-block">Across all specialties</span>
          </div>

          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Emails Delivered</p>
            <h3 class="text-3xl font-extrabold text-emerald-700 mt-2">{{ notifStats()?.sent || 0 }}</h3>
            <span class="text-[11px] font-semibold text-slate-400 mt-1 inline-block">via aiosmtplib</span>
          </div>

          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Queued / Retries</p>
            <h3 class="text-3xl font-extrabold text-amber-600 mt-2">{{ notifStats()?.queued || 0 }}</h3>
            <span class="text-[11px] font-semibold text-amber-700 mt-1 inline-block">APScheduler persistent</span>
          </div>

        </div>

        <!-- Quick Links Hub -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-brand-300 transition">
            <h4 class="text-base font-bold text-slate-900 mb-1">Doctor Management</h4>
            <p class="text-xs text-slate-500 mb-4">Add new doctors, configure consultation fees, room numbers, and track leaves.</p>
            <a routerLink="/admin/doctors" class="text-xs font-bold text-brand-600 hover:text-brand-700">Open Doctors List &rarr;</a>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-brand-300 transition">
            <h4 class="text-base font-bold text-slate-900 mb-1">All Appointments</h4>
            <p class="text-xs text-slate-500 mb-4">View clinic-wide booking logs, patient symptoms, and status breakdowns.</p>
            <a routerLink="/admin/appointments" class="text-xs font-bold text-brand-600 hover:text-brand-700">View All Bookings &rarr;</a>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-brand-300 transition">
            <h4 class="text-base font-bold text-slate-900 mb-1">Notification Logs</h4>
            <p class="text-xs text-slate-500 mb-4">Inspect real-time email dispatch delivery records and automated retry logs.</p>
            <a routerLink="/admin/notifications" class="text-xs font-bold text-brand-600 hover:text-brand-700">Inspect Logs &rarr;</a>
          </div>
        </div>

      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  doctorCount = signal(0);
  appointmentCount = signal(0);
  notifStats = signal<NotificationStats | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.getAdminDoctors().subscribe(docs => {
      this.doctorCount.set(docs.length);
      this.api.getAdminAppointments().subscribe(appts => {
        this.appointmentCount.set(appts.length);
        this.api.getAdminNotifications().subscribe(stats => {
          this.notifStats.set(stats);
          this.loading.set(false);
        });
      });
    });
  }
}
