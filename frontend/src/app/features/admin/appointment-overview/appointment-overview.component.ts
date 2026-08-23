import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Appointment, Doctor } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';

@Component({
  selector: 'app-admin-appointment-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, UrgencyBadgeComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">System Appointments Registry</h1>
        <p class="text-sm text-slate-500 mt-1">Global directory of patient consultations across all practitioners</p>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status Filter</label>
          <select [(ngModel)]="statusFilter" (change)="loadAppointments()"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Doctor Filter</label>
          <select [(ngModel)]="doctorFilter" (change)="loadAppointments()"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
            <option value="">All Doctors</option>
            <option *ngFor="let doc of doctors()" [value]="doc.id">{{ doc.full_name }} ({{ doc.specialisation }})</option>
          </select>
        </div>

        <div class="flex items-end">
          <button (click)="resetFilters()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
            Reset Filters
          </button>
        </div>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading global bookings..."></app-loading-spinner>
      </div>

      <!-- Global Table -->
      <div *ngIf="!loading()" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="py-4 px-6">Doctor</th>
                <th class="py-4 px-6">Patient</th>
                <th class="py-4 px-6">Date & Time</th>
                <th class="py-4 px-6">Urgency</th>
                <th class="py-4 px-6">Status</th>
                <th class="py-4 px-6">Symptoms Summary</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let appt of appointments()" class="hover:bg-slate-50/70 transition">
                <td class="py-4 px-6 font-bold text-slate-900">
                  Dr. {{ appt.doctor_name }}
                  <span class="block text-[11px] font-normal text-slate-400">{{ appt.doctor_specialisation }}</span>
                </td>
                <td class="py-4 px-6 font-semibold text-slate-800">
                  {{ appt.patient_name }}
                  <span class="block text-[11px] font-normal text-slate-400">{{ appt.patient_email }}</span>
                </td>
                <td class="py-4 px-6 whitespace-nowrap">
                  <strong>{{ appt.start_time | date:'MMM d, y' }}</strong>
                  <span class="block text-[11px] text-slate-500">{{ appt.start_time | date:'h:mm a' }}</span>
                </td>
                <td class="py-4 px-6">
                  <app-urgency-badge *ngIf="appt.pre_visit_summary" [level]="appt.pre_visit_summary.urgency_level"></app-urgency-badge>
                </td>
                <td class="py-4 px-6">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': appt.status === 'CONFIRMED',
                          'bg-emerald-100 text-emerald-800': appt.status === 'COMPLETED',
                          'bg-rose-100 text-rose-800': appt.status === 'CANCELLED'
                        }">
                    {{ appt.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-500 max-w-xs truncate italic">
                  "{{ appt.symptoms }}"
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class AdminAppointmentsComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);
  doctors = signal<Doctor[]>([]);

  statusFilter = '';
  doctorFilter = '';

  ngOnInit() {
    this.api.getAdminDoctors().subscribe(docs => this.doctors.set(docs));
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading.set(true);
    this.api.getAdminAppointments(this.statusFilter, this.doctorFilter).subscribe({
      next: (list) => {
        this.loading.set(false);
        this.appointments.set(list);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters() {
    this.statusFilter = '';
    this.doctorFilter = '';
    this.loadAppointments();
  }
}
