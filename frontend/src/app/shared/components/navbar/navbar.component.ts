import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3 cursor-pointer" (click)="navigateHome()">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700 dark:from-white dark:via-brand-200 dark:to-brand-400 bg-clip-text text-transparent">CareSync</span>
              <span class="text-[10px] block font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider -mt-1">Healthcare AI</span>
            </div>
          </div>

          <!-- Navigation Links Based on Role -->
          <nav *ngIf="auth.isAuthenticated()" class="hidden md:flex items-center space-x-1">
            
            <!-- Patient Links -->
            <ng-container *ngIf="auth.isPatient()">
              <a routerLink="/patient/dashboard" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Dashboard
              </a>
              <a routerLink="/patient/doctors" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Find Doctors
              </a>
              <a routerLink="/patient/appointments" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                My Appointments
              </a>
            </ng-container>

            <!-- Doctor Links -->
            <ng-container *ngIf="auth.isDoctor()">
              <a routerLink="/doctor/dashboard" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Today's Queue
              </a>
              <a routerLink="/doctor/appointments" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                All Patients
              </a>
              <a routerLink="/doctor/schedule" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Schedule & Leaves
              </a>
            </ng-container>

            <!-- Admin Links -->
            <ng-container *ngIf="auth.isAdmin()">
              <a routerLink="/admin/dashboard" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Overview
              </a>
              <a routerLink="/admin/doctors" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Doctor Management
              </a>
              <a routerLink="/admin/appointments" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                All Bookings
              </a>
              <a routerLink="/admin/notifications" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Delivery Logs
              </a>
            </ng-container>

          </nav>

          <!-- Right Side: Dark Mode Toggle & User Menu -->
          <div class="flex items-center gap-3">
            
            <!-- Dark Mode Toggle Button -->
            <button (click)="theme.toggleTheme()"
                    [title]="theme.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                    class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition shadow-xs">
              <!-- Sun Icon (for Dark Mode) -->
              <svg *ngIf="theme.isDarkMode()" class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Moon Icon (for Light Mode) -->
              <svg *ngIf="!theme.isDarkMode()" class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <ng-container *ngIf="auth.isAuthenticated(); else authButtons">
              
              <!-- Role Badge -->
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                [ngClass]="{
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700': auth.isPatient(),
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700': auth.isDoctor(),
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700': auth.isAdmin()
                }">
                {{ auth.currentUser()?.role }}
              </span>

              <!-- User Name & Logout -->
              <div class="hidden sm:block text-right">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{{ auth.currentUser()?.full_name }}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">{{ auth.currentUser()?.email }}</p>
              </div>

              <button (click)="auth.logout()"
                      title="Sign Out"
                      class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </ng-container>

            <ng-template #authButtons>
              <a routerLink="/login" class="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition">
                Sign In
              </a>
              <a routerLink="/register" class="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition">
                Register
              </a>
            </ng-template>
          </div>

        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private router = inject(Router);

  navigateHome() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else if (this.auth.isDoctor()) {
      this.router.navigate(['/doctor/dashboard']);
    } else if (this.auth.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/patient/dashboard']);
    }
  }
}
