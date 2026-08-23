import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, Doctor } from '../../core/services/appointment.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-5xl mx-auto">
        <header class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">Available Doctors</h1>
            <p class="text-slate-500 text-sm mt-1">Select a specialist to book your consultation</p>
          </div>
        </header>

        <div *ngIf="loading()" class="text-slate-500 text-center py-12">Loading doctors...</div>

        <div *ngIf="!loading() && doctors().length === 0" class="bg-white p-8 rounded-xl text-center border">
          <p class="text-slate-600">No doctors currently registered in the database.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let doc of doctors()" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-bold text-lg text-slate-800">Doctor Profile</h3>
                <span class="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  {{ doc.specialisation }}
                </span>
              </div>
            </div>
            <p class="text-slate-600 text-sm mt-4 line-clamp-2">{{ doc.bio || 'No bio available.' }}</p>
            <button class="mt-6 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoctorListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);

  doctors = signal<Doctor[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.appointmentService.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}