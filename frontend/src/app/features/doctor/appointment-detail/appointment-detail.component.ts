import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment, PrescriptionItem } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UrgencyBadgeComponent } from '../../../shared/components/urgency-badge/urgency-badge.component';

@Component({
  selector: 'app-doctor-appointment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent, UrgencyBadgeComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Header -->
      <div class="mb-6">
        <a routerLink="/doctor/dashboard" class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Today's Queue
        </a>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Consultation</h1>
            <p class="text-xs text-slate-500 mt-1">Patient: <strong class="text-slate-800">{{ appointment()?.patient_name }}</strong></p>
          </div>

          <div *ngIf="appointment()" class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="{
                    'bg-blue-100 text-blue-800': appointment()?.status === 'CONFIRMED',
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
        <app-loading-spinner message="Loading patient consultation..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading() && appointment()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left Column: AI Pre-Visit Triage & Symptoms -->
        <div class="lg:col-span-1 space-y-6">
          
          <!-- AI Triage Box -->
          <div class="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-300">🤖 AI Clinical Triage</span>
              <app-urgency-badge [level]="appointment()?.pre_visit_summary?.urgency_level || 'Low'"></app-urgency-badge>
            </div>

            <div>
              <p class="text-[11px] font-bold text-slate-400 uppercase">Chief Concern Summary</p>
              <h4 class="text-sm font-bold text-white mt-1">
                {{ appointment()?.pre_visit_summary?.chief_complaint || appointment()?.symptoms }}
              </h4>
            </div>

            <!-- Suggested Doctor Questions -->
            <div *ngIf="appointment()?.pre_visit_summary?.suggested_questions && appointment()?.pre_visit_summary!.suggested_questions.length > 0">
              <p class="text-[11px] font-bold text-brand-300 uppercase mb-2">Suggested Triage Questions</p>
              <ul class="space-y-2 text-xs text-slate-200">
                <li *ngFor="let q of appointment()?.pre_visit_summary?.suggested_questions; let idx = index"
                    class="flex items-start gap-2 bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                  <span class="w-4 h-4 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <span>{{ q }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Raw Symptoms Card -->
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-2">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Self-Reported Symptoms</p>
            <p class="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{{ appointment()?.symptoms }}"
            </p>
            <div class="pt-2 text-[11px] text-slate-400">
              Scheduled: {{ appointment()?.start_time | date:'EEEE, MMM d, h:mm a' }}
            </div>
          </div>

        </div>

        <!-- Right Column: Clinical Notes & Prescription Builder Form -->
        <div class="lg:col-span-2 space-y-6">
          
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            
            <div>
              <h3 class="text-lg font-bold text-slate-900">Physician Notes & Diagnosis</h3>
              <p class="text-xs text-slate-500 mt-0.5">Write your clinical evaluation. Our Groq AI will convert it into a patient-friendly summary upon completion.</p>
            </div>

            <!-- Notes Textarea -->
            <div>
              <label class="block text-xs font-bold uppercase text-slate-700 mb-1.5">Clinical Evaluation & Findings *</label>
              <textarea [(ngModel)]="clinicalNotes" rows="5"
                        placeholder="e.g. Patient presents with elevated blood pressure (145/90). Clear lungs on auscultation. Advised low sodium diet, lifestyle modifications, and prescribed ACE inhibitor."
                        class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"></textarea>
            </div>

            <!-- Prescription Builder -->
            <div class="space-y-4 pt-4 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Prescribed Medications</h4>
                  <p class="text-xs text-slate-400">These will be tracked with automated background reminders</p>
                </div>
                <button type="button" (click)="addPrescriptionRow()"
                        class="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 transition flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Medicine
                </button>
              </div>

              <!-- Prescription Rows -->
              <div *ngIf="prescriptions.length === 0" class="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No medications added yet. Click "+ Add Medicine" if prescribing.
              </div>

              <div *ngFor="let rx of prescriptions; let idx = index"
                   class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-700">Medication #{{ idx + 1 }}</span>
                  <button (click)="removePrescriptionRow(idx)" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">
                    Remove
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Medicine Name</label>
                    <input [(ngModel)]="rx.medicine" type="text" placeholder="e.g. Amoxicillin"
                           class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dosage</label>
                    <input [(ngModel)]="rx.dosage" type="text" placeholder="e.g. 500mg"
                           class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Frequency</label>
                    <input [(ngModel)]="rx.frequency" type="text" placeholder="e.g. Twice daily after meals"
                           class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Duration (Days)</label>
                    <input [(ngModel)]="rx.duration_days" type="number" min="1" max="90" placeholder="7"
                           class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button (click)="onSubmitNotes()" [disabled]="submitting() || !clinicalNotes.trim()"
                      class="px-8 py-3 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2">
                <span *ngIf="submitting()" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>{{ submitting() ? 'Generating AI Patient Summary & Saving...' : 'Submit Notes & Complete Visit' }}</span>
              </button>
            </div>

          </div>

          <!-- Existing AI Post-Visit Summary (if completed) -->
          <div *ngIf="appointment()?.post_visit_summary" class="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-xs space-y-3">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ✓ AI Post-Visit Summary Sent to Patient
            </span>
            <p class="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {{ appointment()?.post_visit_summary }}
            </p>
          </div>

        </div>

      </div>

    </div>
  `
})
export class DoctorAppointmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  appointmentId: string = '';
  appointment = signal<Appointment | null>(null);
  loading = signal(true);
  submitting = signal(false);

  clinicalNotes = '';
  prescriptions: PrescriptionItem[] = [];

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDetail();
  }

  loadDetail() {
    this.loading.set(true);
    this.api.getDoctorAppointmentDetail(this.appointmentId).subscribe({
      next: (appt) => {
        this.loading.set(false);
        this.appointment.set(appt);
        if (appt.clinical_notes) {
          this.clinicalNotes = appt.clinical_notes;
        }
        if (appt.prescriptions && appt.prescriptions.length > 0) {
          this.prescriptions = [...appt.prescriptions];
        }
      },
      error: () => this.loading.set(false)
    });
  }

  addPrescriptionRow() {
    this.prescriptions.push({
      medicine: '',
      dosage: '',
      frequency: 'Once daily',
      duration_days: 7,
      instructions: 'Take after meals'
    });
  }

  removePrescriptionRow(idx: number) {
    this.prescriptions.splice(idx, 1);
  }

  onSubmitNotes() {
    if (!this.clinicalNotes.trim()) return;

    this.submitting.set(true);
    this.api.submitClinicalNotes(this.appointmentId, this.clinicalNotes, this.prescriptions).subscribe({
      next: (updatedAppt) => {
        this.submitting.set(false);
        this.appointment.set(updatedAppt);
        this.notifications.success('Clinical notes submitted! Post-visit summary generated and emailed to patient.');
      },
      error: (err) => {
        this.submitting.set(false);
        this.notifications.error(err.error?.detail || 'Failed to submit clinical notes.');
      }
    });
  }
}
