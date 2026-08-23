import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-brand-50/40 to-slate-100">
      <div class="max-w-md w-full">
        
        <div class="text-center mb-8">
          <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Create Patient Account</h2>
          <p class="text-sm text-slate-500 mt-2">Join CareSync for AI symptom triage, verified doctors & instant booking</p>
        </div>

        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          
          <form (ngSubmit)="onRegister()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
              <input [(ngModel)]="fullName" name="fullName" type="text" required placeholder="e.g. Eleanor Vance"
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
              <input [(ngModel)]="email" name="email" type="email" required placeholder="name@example.com"
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number (Optional)</label>
              <input [(ngModel)]="phoneNumber" name="phoneNumber" type="tel" placeholder="+1 (555) 000-0000"
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Create Password</label>
              <input [(ngModel)]="password" name="password" type="password" required placeholder="Min 6 characters"
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" />
            </div>

            <div *ngIf="errorMessage()" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
              <span *ngIf="loading()" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ loading() ? 'Creating account...' : 'Create Free Account' }}</span>
            </button>
          </form>

          <div class="text-center mt-6">
            <p class="text-xs text-slate-500">
              Already have an account?
              <a routerLink="/login" class="font-bold text-brand-600 hover:text-brand-700 ml-1">Sign in here</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notifications = inject(NotificationService);

  fullName = '';
  email = '';
  phoneNumber = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  onRegister() {
    if (!this.fullName || !this.email || !this.password) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register({
      full_name: this.fullName,
      email: this.email,
      phone_number: this.phoneNumber,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notifications.success('Account created successfully! Welcome to CareSync.');
        this.router.navigate(['/patient/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err.error?.detail;
        if (typeof detail === 'string') {
          this.errorMessage.set(detail);
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
      }
    });
  }
}
