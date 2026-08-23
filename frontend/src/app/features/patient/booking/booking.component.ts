import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Doctor, SlotItem, HoldSlotResponse } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Stepper Header -->
      <div class="mb-8">
        <a routerLink="/patient/doctors" class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Doctors
        </a>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Book Consultation</h1>
        <p *ngIf="doctor()" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          With <strong class="text-slate-700 dark:text-slate-200">{{ doctor()?.full_name }}</strong> ({{ doctor()?.specialisation }})
        </p>

        <!-- 4-Step Progress Bar -->
        <div class="mt-6 grid grid-cols-4 gap-2">
          <div class="h-2 rounded-full transition-all" [ngClass]="currentStep() >= 1 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'"></div>
          <div class="h-2 rounded-full transition-all" [ngClass]="currentStep() >= 2 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'"></div>
          <div class="h-2 rounded-full transition-all" [ngClass]="currentStep() >= 3 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'"></div>
          <div class="h-2 rounded-full transition-all" [ngClass]="currentStep() >= 4 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'"></div>
        </div>

        <div class="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">
          <span [class.text-brand-600]="currentStep() === 1" [class.dark:text-brand-400]="currentStep() === 1">1. Date</span>
          <span [class.text-brand-600]="currentStep() === 2" [class.dark:text-brand-400]="currentStep() === 2">2. Slot Hold</span>
          <span [class.text-brand-600]="currentStep() === 3" [class.dark:text-brand-400]="currentStep() === 3">3. Symptoms</span>
          <span [class.text-brand-600]="currentStep() === 4" [class.dark:text-brand-400]="currentStep() === 4">4. Confirm</span>
        </div>
      </div>

      <!-- Main Step Container -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">

        <!-- STEP 1: SELECT DATE -->
        <div *ngIf="currentStep() === 1" class="space-y-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Step 1: Choose Appointment Date</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a consultation date within the next 14 days</p>
          </div>

          <div class="max-w-xs">
            <label class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Consultation Date</label>
            <input [(ngModel)]="selectedDate" (change)="onDateChange()" [min]="minDate" [max]="maxDate"
                   type="date" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          <div class="flex justify-end">
            <button (click)="proceedToStep(2)" [disabled]="!selectedDate"
                    class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2">
              <span>View Available Slots</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- STEP 2: CHOOSE SLOT (5-MIN TTL HOLD) -->
        <div *ngIf="currentStep() === 2" class="space-y-6">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Step 2: Select Time Slot</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Date: <strong class="text-slate-800 dark:text-slate-200">{{ selectedDate | date:'fullDate' }}</strong>
              </p>
            </div>

            <div *ngIf="holdActive()" class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-amber-900 dark:text-amber-300 animate-pulse">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="text-xs font-bold">Slot Held: {{ holdTimerDisplay() }}</span>
            </div>
          </div>

          <div *ngIf="loadingSlots()">
            <app-loading-spinner message="Checking real-time doctor availability..."></app-loading-spinner>
          </div>

          <div *ngIf="!loadingSlots() && slots().length === 0" class="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No available slots for this date</p>
            <p class="text-xs text-slate-400 mt-1 mb-4">Doctor is off duty or all slots are booked.</p>
            <button (click)="proceedToStep(1)" class="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              Pick Another Date
            </button>
          </div>

          <!-- Slots Grid -->
          <div *ngIf="!loadingSlots() && slots().length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button *ngFor="let s of slots()"
                    (click)="selectAndHoldSlot(s)"
                    [disabled]="!s.is_available"
                    class="py-3 px-4 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1"
                    [ngClass]="{
                      'bg-brand-600 text-white border-brand-600 shadow-md scale-102': selectedSlot?.start_time === s.start_time,
                      'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-slate-700': s.is_available && selectedSlot?.start_time !== s.start_time,
                      'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed line-through': !s.is_available
                    }">
              <span>{{ s.start_time | date:'h:mm a' }}</span>
              <span class="text-[10px] font-normal" [ngClass]="selectedSlot?.start_time === s.start_time ? 'text-brand-100' : 'text-slate-400'">
                {{ s.is_available ? 'Available' : 'Booked' }}
              </span>
            </button>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button (click)="proceedToStep(1)" class="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl">
              Back
            </button>
            <button (click)="proceedToStep(3)" [disabled]="!selectedSlot"
                    class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2">
              <span>Next: Describe Symptoms</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- STEP 3: DESCRIBE SYMPTOMS (AI TRIAGE) -->
        <div *ngIf="currentStep() === 3" class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-2">
              <span>🤖 AI Clinical Assistant Enabled</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Step 3: Tell Us About Your Symptoms</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Our Groq AI triage model will analyze this to highlight urgency and prepare doctor questions.</p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Concerns, Pain, or Symptoms *
            </label>
            <textarea [(ngModel)]="symptoms" rows="4" required
                      placeholder="e.g. Sharp pain in left shoulder radiating down arm for 2 days. Mild shortness of breath when walking."
                      class="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"></textarea>
          </div>

          <div class="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <p class="font-bold flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How AI Triage Works:
            </p>
            <p class="text-blue-800 dark:text-blue-300">
              Your symptoms will automatically be categorized by urgency level (🔴 High, 🟡 Medium, 🟢 Low) so your doctor can prepare targeted questions before your consultation.
            </p>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button (click)="proceedToStep(2)" class="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl">
              Back
            </button>
            <button (click)="proceedToStep(4)" [disabled]="!symptoms.trim()"
                    class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2">
              <span>Review & Confirm</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- STEP 4: REVIEW & CONFIRM -->
        <div *ngIf="currentStep() === 4" class="space-y-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Step 4: Review & Finalize Booking</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Confirm your appointment summary below</p>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 space-y-4 text-xs">
            <div class="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Doctor:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ doctor()?.full_name }} ({{ doctor()?.specialisation }})</span>
            </div>

            <div class="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Date & Time:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ selectedSlot?.start_time | date:'EEEE, MMM d, y, h:mm a' }}</span>
            </div>

            <div class="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Consultation Fee:</span>
              <span class="font-extrabold text-brand-700 dark:text-brand-400">\${{ doctor()?.consultation_fee }}</span>
            </div>

            <div class="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Location:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ doctor()?.room_number || 'Room 101' }}</span>
            </div>

            <div>
              <span class="text-slate-500 dark:text-slate-400 font-medium block mb-1">Chief Concern:</span>
              <p class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 italic">
                "{{ symptoms }}"
              </p>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button (click)="proceedToStep(3)" class="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl">
              Back
            </button>
            <button (click)="confirmBooking()" [disabled]="bookingLoading()"
                    class="px-8 py-3 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2">
              <span *ngIf="bookingLoading()" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ bookingLoading() ? 'Confirming with AI Triage...' : 'Confirm Appointment' }}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  `
})
export class BookingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  doctorId: string = '';
  doctor = signal<Doctor | null>(null);

  currentStep = signal(1);
  selectedDate: string = '';
  minDate: string = '';
  maxDate: string = '';

  slots = signal<SlotItem[]>([]);
  loadingSlots = signal(false);
  selectedSlot: SlotItem | null = null;

  symptoms: string = '';
  bookingLoading = signal(false);

  // Hold Timer State
  holdActive = signal(false);
  holdExpiryTime: number = 0;
  holdTimerDisplay = signal('05:00');
  private timerInterval: any = null;

  ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('doctorId') || '';
    
    const today = new Date();
    const max = new Date();
    max.setDate(today.getDate() + 14);

    this.minDate = today.toISOString().split('T')[0];
    this.maxDate = max.toISOString().split('T')[0];
    this.selectedDate = this.minDate;

    this.loadDoctor();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadDoctor() {
    this.api.getDoctor(this.doctorId).subscribe({
      next: (doc) => this.doctor.set(doc),
      error: () => {
        this.notifications.error('Could not load doctor profile.');
        this.router.navigate(['/patient/doctors']);
      }
    });
  }

  onDateChange() {
    this.selectedSlot = null;
    this.stopHoldTimer();
  }

  proceedToStep(step: number) {
    if (step === 2 && this.selectedDate) {
      this.loadSlots();
    }
    this.currentStep.set(step);
  }

  loadSlots() {
    this.loadingSlots.set(true);
    this.api.getDoctorSlots(this.doctorId, this.selectedDate).subscribe({
      next: (slots) => {
        this.loadingSlots.set(false);
        this.slots.set(slots);
      },
      error: () => {
        this.loadingSlots.set(false);
        this.notifications.error('Could not retrieve slot availability.');
      }
    });
  }

  selectAndHoldSlot(slot: SlotItem) {
    if (!slot.is_available) return;
    this.selectedSlot = slot;

    this.api.holdSlot(this.doctorId, slot.start_time).subscribe({
      next: (res) => {
        this.startHoldTimer(5 * 60);
        this.notifications.success('Time slot temporarily held for 5 minutes.');
      },
      error: (err) => {
        this.notifications.error(err.error?.detail || 'This slot was just held by another patient.');
        this.loadSlots();
      }
    });
  }

  startHoldTimer(seconds: number) {
    this.stopHoldTimer();
    this.holdActive.set(true);
    this.holdExpiryTime = Date.now() + seconds * 1000;

    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((this.holdExpiryTime - Date.now()) / 1000));
      if (remaining <= 0) {
        this.stopHoldTimer();
        this.notifications.warning('Slot hold expired. Please pick your slot again.');
        this.selectedSlot = null;
        this.loadSlots();
      } else {
        this.updateTimerDisplay(remaining);
      }
    }, 1000);
  }

  stopHoldTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.holdActive.set(false);
  }

  updateTimerDisplay(totalSeconds?: number) {
    const s = totalSeconds ?? Math.max(0, Math.floor((this.holdExpiryTime - Date.now()) / 1000));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    this.holdTimerDisplay.set(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  }

  confirmBooking() {
    if (!this.selectedSlot || !this.symptoms.trim()) return;

    this.bookingLoading.set(true);
    this.api.bookAppointment({
      doctor_id: this.doctorId,
      start_time: this.selectedSlot.start_time,
      symptoms: this.symptoms
    }).subscribe({
      next: (appt) => {
        this.bookingLoading.set(false);
        this.stopHoldTimer();
        this.notifications.success('Consultation booked! Confirmation email and calendar invite sent.');
        this.router.navigate(['/patient/appointments', appt.id]);
      },
      error: (err) => {
        this.bookingLoading.set(false);
        this.notifications.error(err.error?.detail || 'Double booking prevented or slot conflict.');
      }
    });
  }
}
