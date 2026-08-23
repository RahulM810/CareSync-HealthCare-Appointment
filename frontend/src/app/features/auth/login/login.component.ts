import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-brand-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      <div class="max-w-md w-full">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome to CareSync</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign in to access your appointments, medical triage & records</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 p-8 backdrop-blur-sm transition-colors duration-200">
          
          <!-- One-click Demo Accounts Switcher -->
          <div class="mb-6 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Demo Accounts
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="fillDemo('patient.john@example.com', 'password123')"
                      class="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left transition flex items-center justify-between">
                <span>👤 Patient John</span>
                <span class="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Try</span>
              </button>
              <button type="button" (click)="fillDemo('dr.sarah@healthcare.com', 'password123')"
                      class="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left transition flex items-center justify-between">
                <span>🩺 Dr. Sarah</span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Try</span>
              </button>
              <button type="button" (click)="fillDemo('admin@healthcare.com', 'password123')"
                      class="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left transition flex items-center justify-between">
                <span>👑 Admin</span>
                <span class="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Try</span>
              </button>
              <button type="button" (click)="fillDemo('dr.alex@healthcare.com', 'password123')"
                      class="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left transition flex items-center justify-between">
                <span>🩺 Dr. Alex</span>
                <span class="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Try</span>
              </button>
            </div>
          </div>

          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input [(ngModel)]="email" name="email" type="email" required placeholder="name@example.com"
                     class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input [(ngModel)]="password" name="password" type="password" required placeholder="••••••••"
                     class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition" />
            </div>

            <div *ngIf="errorMessage()" class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
              <span *ngIf="loading()" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ loading() ? 'Signing in...' : 'Sign In to Account' }}</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <span class="relative bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-400 uppercase">Or continue with</span>
          </div>

          <!-- Google OAuth Sign-in Button -->
          <button (click)="onGoogleLogin()" type="button"
                  class="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs flex items-center justify-center gap-3 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google & Calendar Sync</span>
          </button>

          <!-- Register Link -->
          <div class="text-center mt-6">
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Don't have a patient account?
              <a routerLink="/register" class="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 ml-1">Create Account</a>
            </p>
          </div>

        </div>

      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);

  email = 'patient.john@example.com';
  password = 'password123';
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        localStorage.setItem('access_token', params['token']);
        this.authService.token.set(params['token']);
        this.authService.loadCurrentUser().subscribe(user => {
          if (user) {
            this.notifications.success(`Welcome back, ${user.full_name}!`);
            this.redirectUser(user.role);
          }
        });
      } else if (params['error']) {
        this.errorMessage.set('Google sign-in was cancelled or encountered an error.');
      }
    });
  }

  fillDemo(email: string, pass: string) {
    this.email = email;
    this.password = pass;
    this.errorMessage.set('');
  }

  onLogin() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notifications.success(`Welcome back, ${res.full_name}!`);
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err.error?.detail;
        if (typeof detail === 'string') {
          this.errorMessage.set(detail);
        } else {
          this.errorMessage.set('Invalid credentials. Please verify your email and password.');
        }
      }
    });
  }

  onGoogleLogin() {
    this.authService.getGoogleAuthUrl().subscribe({
      next: (res) => {
        if (res.auth_url) {
          window.location.href = res.auth_url;
        }
      },
      error: () => {
        this.notifications.error('Could not initiate Google authentication.');
      }
    });
  }

  private redirectUser(role: string) {
    if (role === 'DOCTOR') {
      this.router.navigate(['/doctor/dashboard']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/patient/dashboard']);
    }
  }
}
