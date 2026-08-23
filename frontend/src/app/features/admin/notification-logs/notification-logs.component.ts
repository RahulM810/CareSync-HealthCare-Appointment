import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationStats } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-notification-logs',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Email Notification Logs</h1>
          <p class="text-sm text-slate-500 mt-1">Real-time tracking of email dispatches, reminders, and APScheduler retries</p>
        </div>
        <button (click)="loadLogs()"
                class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5">
          <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Logs
        </button>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Querying delivery logs..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading()" class="space-y-6">
        
        <!-- Summary Counters -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase">Total Notifications</p>
            <h3 class="text-3xl font-extrabold text-slate-900 mt-1">{{ stats()?.total_notifications || 0 }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-emerald-600 uppercase">Successfully Sent</p>
            <h3 class="text-3xl font-extrabold text-emerald-700 mt-1">{{ stats()?.sent || 0 }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-amber-600 uppercase">Queued / In-Transit</p>
            <h3 class="text-3xl font-extrabold text-amber-600 mt-1">{{ stats()?.queued || 0 }}</h3>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p class="text-xs font-bold text-rose-600 uppercase">Failed Attempts</p>
            <h3 class="text-3xl font-extrabold text-rose-700 mt-1">{{ stats()?.failed || 0 }}</h3>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th class="py-4 px-6">Recipient</th>
                  <th class="py-4 px-6">Type</th>
                  <th class="py-4 px-6">Subject</th>
                  <th class="py-4 px-6">Status</th>
                  <th class="py-4 px-6">Retries</th>
                  <th class="py-4 px-6">Dispatched At</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr *ngIf="!stats()?.recent_logs || stats()?.recent_logs!.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400">
                    No email logs recorded yet. Book an appointment or submit clinical notes to trigger notifications.
                  </td>
                </tr>
                <tr *ngFor="let log of stats()?.recent_logs" class="hover:bg-slate-50/70 transition">
                  <td class="py-4 px-6">
                    <strong class="text-slate-900 block">{{ log.recipient_name }}</strong>
                    <span class="text-slate-400 text-[11px]">{{ log.recipient_email }}</span>
                  </td>
                  <td class="py-4 px-6 font-semibold text-brand-700">
                    {{ log.notification_type }}
                  </td>
                  <td class="py-4 px-6 font-medium text-slate-800">
                    {{ log.subject }}
                  </td>
                  <td class="py-4 px-6">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800': log.status === 'SENT',
                            'bg-amber-100 text-amber-800': log.status === 'QUEUED',
                            'bg-rose-100 text-rose-800': log.status === 'FAILED'
                          }">
                      {{ log.status }}
                    </span>
                  </td>
                  <td class="py-4 px-6 font-bold text-slate-600">
                    {{ log.retry_count }}
                  </td>
                  <td class="py-4 px-6 text-slate-500 whitespace-nowrap">
                    {{ log.created_at | date:'short' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `
})
export class NotificationLogsComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  stats = signal<NotificationStats | null>(null);

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading.set(true);
    this.api.getAdminNotifications().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.stats.set(data);
      },
      error: () => this.loading.set(false)
    });
  }
}
