import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DoctorLeave, WorkingHours } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Schedule & Leave Management</h1>
        <p class="text-sm text-slate-500 mt-1">Manage weekly clinic availability hours and record planned doctor leaves</p>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading schedule details..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Weekly Schedule Table -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 class="text-lg font-bold text-slate-900 mb-1">Standard Weekly Availability</h3>
            <p class="text-xs text-slate-400 mb-6">Your regular consultation shifts and slot duration</p>

            <div class="space-y-3">
              <div *ngFor="let wh of workingHours"
                   class="flex items-center justify-between p-4 rounded-2xl border"
                   [ngClass]="wh.is_working ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-slate-200/60 opacity-60'">
                <span class="text-sm font-bold text-slate-800">{{ getDayName(wh.day_of_week) }}</span>
                <div class="text-xs font-semibold" [ngClass]="wh.is_working ? 'text-brand-700' : 'text-slate-400'">
                  {{ wh.is_working ? (wh.start_hour + ':00 AM – ' + (wh.end_hour > 12 ? (wh.end_hour - 12) + ':00 PM' : wh.end_hour + ':00 PM')) : 'Off Duty' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Existing Leaves List -->
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 class="text-lg font-bold text-slate-900 mb-1">Recorded Leave Days</h3>
            <p class="text-xs text-slate-400 mb-4">Dates when patient slots are blocked</p>

            <div *ngIf="leaves().length === 0" class="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
              No leave dates recorded.
            </div>

            <div *ngIf="leaves().length > 0" class="space-y-3">
              <div *ngFor="let l of leaves()"
                   class="flex items-center justify-between p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">{{ l.leave_date | date:'fullDate' }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Reason: {{ l.reason || 'Personal leave' }}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {{ l.affected_appointments }} Affected Visits
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Request Leave Card -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs sticky top-24 space-y-4">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Record Doctor Leave</h3>
              <p class="text-xs text-slate-500 mt-0.5">Booking slots will be blocked and affected patients will receive automated reschedule notices.</p>
            </div>

            <form (ngSubmit)="onRequestLeave()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Leave Date *</label>
                <input [(ngModel)]="leaveDate" name="leaveDate" [min]="minDate" type="date" required
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Reason / Notes</label>
                <input [(ngModel)]="leaveReason" name="leaveReason" type="text" placeholder="e.g. Medical Conference / Personal"
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚠️ Marking leave automatically notifies all patients booked on this day with an email to reschedule.
              </div>

              <button type="submit" [disabled]="submitting() || !leaveDate"
                      class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="submitting()" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>{{ submitting() ? 'Recording Leave...' : 'Submit Leave' }}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  `
})
export class DoctorScheduleComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  submitting = signal(false);

  workingHours: WorkingHours[] = [];
  leaves = signal<DoctorLeave[]>([]);

  leaveDate = '';
  leaveReason = '';
  minDate = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.loadSchedule();
  }

  loadSchedule() {
    this.loading.set(true);
    this.api.getDoctorSchedule().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.workingHours = data.working_hours || [];
        this.leaves.set(data.leaves || []);
      },
      error: () => this.loading.set(false)
    });
  }

  getDayName(day: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || 'Day';
  }

  onRequestLeave() {
    if (!this.leaveDate) return;

    this.submitting.set(true);
    this.api.requestDoctorLeave({ leave_date: this.leaveDate, reason: this.leaveReason }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.notifications.success(`Leave recorded for ${this.leaveDate}. Affected patients have been notified.`);
        this.leaveDate = '';
        this.leaveReason = '';
        this.loadSchedule();
      },
      error: (err) => {
        this.submitting.set(false);
        this.notifications.error(err.error?.detail || 'Could not record leave.');
      }
    });
  }
}
