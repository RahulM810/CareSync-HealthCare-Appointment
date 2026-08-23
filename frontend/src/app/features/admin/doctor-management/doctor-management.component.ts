import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Doctor, DoctorLeave } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-doctor-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Doctor Management</h1>
          <p class="text-sm text-slate-500 mt-1">Add certified practitioners, configure rates, and manage clinic leaves</p>
        </div>
        <button (click)="openCreateModal()"
                class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2">
          + Add New Doctor
        </button>
      </div>

      <div *ngIf="loading()">
        <app-loading-spinner message="Loading doctors..."></app-loading-spinner>
      </div>

      <!-- Doctors Table -->
      <div *ngIf="!loading()" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="py-4 px-6">Doctor</th>
                <th class="py-4 px-6">Specialisation</th>
                <th class="py-4 px-6">Fee</th>
                <th class="py-4 px-6">Room</th>
                <th class="py-4 px-6">Status</th>
                <th class="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let doc of doctors()" class="hover:bg-slate-50/70 transition">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {{ doc.full_name[0] }}
                    </div>
                    <div>
                      <strong class="text-slate-900 block font-bold">{{ doc.full_name }}</strong>
                      <span class="text-slate-400 text-[11px]">{{ doc.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700">
                    {{ doc.specialisation }}
                  </span>
                </td>
                <td class="py-4 px-6 font-bold text-slate-900">\${{ doc.consultation_fee }}</td>
                <td class="py-4 px-6 text-slate-600">{{ doc.room_number || 'Room 101' }}</td>
                <td class="py-4 px-6">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        [ngClass]="doc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ doc.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right space-x-2">
                  <button (click)="openLeaveModal(doc)" class="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg border border-amber-200 transition text-[11px]">
                    Manage Leave
                  </button>
                  <button *ngIf="doc.is_active" (click)="deactivate(doc.id)" class="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition text-[11px]">
                    Deactivate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE DOCTOR MODAL -->
      <div *ngIf="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-bold text-slate-900">Add New Doctor</h3>
            <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <form (ngSubmit)="submitCreateDoctor()" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Full Name *</label>
              <input [(ngModel)]="newDoc.full_name" name="name" type="text" required placeholder="e.g. Dr. Maya Lin"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Email *</label>
                <input [(ngModel)]="newDoc.email" name="email" type="email" required placeholder="dr.maya@clinic.com"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Password *</label>
                <input [(ngModel)]="newDoc.password" name="password" type="password" required placeholder="••••••••"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Specialisation *</label>
                <input [(ngModel)]="newDoc.specialisation" name="spec" type="text" required placeholder="e.g. Neurology"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Consultation Fee ($)</label>
                <input [(ngModel)]="newDoc.consultation_fee" name="fee" type="number" min="10" placeholder="75"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Room / Clinic Suite</label>
              <input [(ngModel)]="newDoc.room_number" name="room" type="text" placeholder="Suite 201"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Doctor Bio</label>
              <textarea [(ngModel)]="newDoc.bio" name="bio" rows="2" placeholder="Clinician overview..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" (click)="showCreateModal = false" class="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" [disabled]="savingDoctor" class="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-xs">
                {{ savingDoctor ? 'Creating...' : 'Create Doctor' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- LEAVE MANAGEMENT MODAL -->
      <div *ngIf="selectedDoctorForLeave" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Manage Leave</h3>
              <p class="text-xs text-slate-500">{{ selectedDoctorForLeave.full_name }} ({{ selectedDoctorForLeave.specialisation }})</p>
            </div>
            <button (click)="selectedDoctorForLeave = null" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <!-- Add Leave Form -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <h4 class="font-bold text-slate-800 uppercase text-[10px]">Record Leave Day</h4>
            <div class="grid grid-cols-2 gap-2">
              <input [(ngModel)]="newLeaveDate" type="date" [min]="minDate" class="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
              <input [(ngModel)]="newLeaveReason" type="text" placeholder="Reason" class="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
            </div>
            <button (click)="submitDoctorLeave()" class="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs">
              Block Date & Notify Patients
            </button>
          </div>

          <!-- Existing Leaves -->
          <div>
            <h4 class="font-bold text-slate-700 text-xs mb-2">Leave Records</h4>
            <div *ngIf="doctorLeaves().length === 0" class="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
              No leave records found.
            </div>
            <div *ngFor="let l of doctorLeaves()" class="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex justify-between items-center text-xs mb-2">
              <div>
                <strong class="text-slate-800">{{ l.leave_date | date:'mediumDate' }}</strong>
                <span class="text-slate-500 block text-[11px]">{{ l.reason || 'Personal' }} ({{ l.affected_appointments }} affected)</span>
              </div>
              <button (click)="cancelLeave(l.id)" class="text-rose-600 hover:text-rose-800 font-bold text-[11px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class DoctorManagementComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  loading = signal(true);
  doctors = signal<Doctor[]>([]);
  showCreateModal = false;
  savingDoctor = false;

  newDoc = {
    full_name: '',
    email: '',
    password: '',
    specialisation: '',
    consultation_fee: 65,
    room_number: 'Room 101',
    bio: ''
  };

  selectedDoctorForLeave: Doctor | null = null;
  doctorLeaves = signal<DoctorLeave[]>([]);
  newLeaveDate = '';
  newLeaveReason = '';
  minDate = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading.set(true);
    this.api.getAdminDoctors().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.doctors.set(list);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.newDoc = {
      full_name: '',
      email: '',
      password: '',
      specialisation: '',
      consultation_fee: 65,
      room_number: 'Room 101',
      bio: ''
    };
    this.showCreateModal = true;
  }

  submitCreateDoctor() {
    this.savingDoctor = true;
    this.api.createDoctor(this.newDoc).subscribe({
      next: (doc) => {
        this.savingDoctor = false;
        this.showCreateModal = false;
        this.notifications.success(`Dr. ${doc.full_name} created successfully.`);
        this.loadDoctors();
      },
      error: (err) => {
        this.savingDoctor = false;
        this.notifications.error(err.error?.detail || 'Failed to create doctor.');
      }
    });
  }

  deactivate(id: string) {
    if (!confirm('Are you sure you want to deactivate this doctor?')) return;
    this.api.deactivateDoctor(id).subscribe({
      next: () => {
        this.notifications.success('Doctor deactivated.');
        this.loadDoctors();
      }
    });
  }

  openLeaveModal(doc: Doctor) {
    this.selectedDoctorForLeave = doc;
    this.newLeaveDate = '';
    this.newLeaveReason = '';
    this.api.getDoctorLeaves(doc.id).subscribe(leaves => {
      this.doctorLeaves.set(leaves);
    });
  }

  submitDoctorLeave() {
    if (!this.selectedDoctorForLeave || !this.newLeaveDate) return;
    this.api.createDoctorLeave(this.selectedDoctorForLeave.id, {
      leave_date: this.newLeaveDate,
      reason: this.newLeaveReason
    }).subscribe({
      next: () => {
        this.notifications.success('Leave recorded and affected patients notified.');
        this.openLeaveModal(this.selectedDoctorForLeave!);
      },
      error: (err) => {
        this.notifications.error(err.error?.detail || 'Could not record leave.');
      }
    });
  }

  cancelLeave(leaveId: string) {
    if (!this.selectedDoctorForLeave) return;
    this.api.cancelDoctorLeave(this.selectedDoctorForLeave.id, leaveId).subscribe({
      next: () => {
        this.notifications.success('Leave cancelled.');
        this.openLeaveModal(this.selectedDoctorForLeave!);
      }
    });
  }
}
