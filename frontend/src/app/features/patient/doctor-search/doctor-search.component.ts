import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Doctor } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { DoctorNamePipe } from '../../../shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-doctor-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent, DoctorNamePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Search & Title Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Find & Book Top Doctors</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Select from board-certified specialists with real-time slot availability</p>
        
        <!-- Search and Filter Bar -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2 relative">
            <input [(ngModel)]="searchQuery" (input)="onSearchChange()" type="text"
                   placeholder="Search by doctor name or specialty..."
                   class="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none shadow-xs transition" />
            <svg class="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div>
            <select [(ngModel)]="selectedSpecialisation" (change)="onSpecialisationChange()"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-xs text-slate-700 dark:text-slate-200 transition">
              <option value="">All Specialisations</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>
          </div>
        </div>

        <!-- Specialty Filter Badges -->
        <div class="flex flex-wrap gap-2 mt-4">
          <button *ngFor="let spec of specialties"
                  (click)="filterBySpecialty(spec)"
                  class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
                  [ngClass]="selectedSpecialisation === spec ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'">
            {{ spec || 'All Doctors' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()">
        <app-loading-spinner message="Finding certified doctors..."></app-loading-spinner>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && filteredDoctors().length === 0" class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white">No doctors match your criteria</h3>
        <p class="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search query or selecting a different specialty.</p>
        <button (click)="resetFilters()" class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
          Reset Filters
        </button>
      </div>

      <!-- Doctors Grid -->
      <div *ngIf="!loading() && filteredDoctors().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let doc of filteredDoctors()"
             class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-600 transition duration-200 flex flex-col justify-between group">
          
          <div>
            <div class="flex items-start gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                {{ getInitials(doc.full_name) }}
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{{ doc.full_name | doctorName }}</h3>
                <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800 mt-1">
                  {{ doc.specialisation }}
                </span>
              </div>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
              {{ doc.bio || 'Experienced clinician providing personalized patient diagnosis and treatment.' }}
            </p>

            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60 text-xs space-y-2 mb-4">
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Consultation Fee:
                </span>
                <strong class="text-slate-800 dark:text-white font-bold">\${{ doc.consultation_fee }}</strong>
              </div>

              <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Room:
                </span>
                <span class="text-slate-700 dark:text-slate-300 font-medium">{{ doc.room_number || 'Suite 101' }}</span>
              </div>
            </div>

            <div *ngIf="doc.next_available_slot" class="mb-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Next Available: {{ doc.next_available_slot | date:'EEE, MMM d, h:mm a' }}
              </span>
            </div>
          </div>

          <a [routerLink]="['/patient/book', doc.id]"
             class="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition text-center flex items-center justify-center gap-2 group-hover:shadow-md">
            <span>Book Consultation</span>
            <svg class="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

        </div>
      </div>

    </div>
  `
})
export class DoctorSearchComponent implements OnInit {
  private api = inject(ApiService);

  doctors = signal<Doctor[]>([]);
  filteredDoctors = signal<Doctor[]>([]);
  loading = signal(true);

  searchQuery = '';
  selectedSpecialisation = '';

  specialties = [
    '',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'General Medicine'
  ];

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading.set(true);
    this.api.getDoctors().subscribe({
      next: (list) => {
        this.loading.set(false);
        this.doctors.set(list);
        this.applyFilter();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.applyFilter();
  }

  onSpecialisationChange() {
    this.applyFilter();
  }

  filterBySpecialty(spec: string) {
    this.selectedSpecialisation = spec;
    this.applyFilter();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedSpecialisation = '';
    this.applyFilter();
  }

  private applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    const spec = this.selectedSpecialisation.toLowerCase().trim();

    const filtered = this.doctors().filter(d => {
      const matchSpec = !spec || d.specialisation.toLowerCase().includes(spec);
      const matchQuery = !q ||
        d.full_name.toLowerCase().includes(q) ||
        d.specialisation.toLowerCase().includes(q) ||
        (d.bio && d.bio.toLowerCase().includes(q));
      return matchSpec && matchQuery;
    });

    this.filteredDoctors.set(filtered);
  }

  getInitials(name: string): string {
    if (!name) return 'DR';
    const cleaned = name.replace(/^((dr\.?|doctor)\s*)+/gi, '').trim();
    return (
      cleaned
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'DR'
    );
  }
}
