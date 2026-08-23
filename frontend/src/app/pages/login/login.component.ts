import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <h2 class="text-2xl font-bold text-slate-800 text-center">Welcome Back</h2>
        <p class="text-sm text-slate-500 text-center mt-1">Sign in to book and manage appointments</p>

        <form (ngSubmit)="onLogin()" class="mt-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Email</label>
            <input [(ngModel)]="email" name="email" type="email" required
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
            <input [(ngModel)]="password" name="password" type="password" required
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>

          <div *ngIf="errorMessage()" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {{ errorMessage() }}
          </div>

          <button type="submit" [disabled]="loading()"
            class="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-150 disabled:opacity-50">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

onLogin() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/doctors']);
      },
      error: (err) => {
        this.loading.set(false);
        
        const detail = err.error?.detail;
        if (Array.isArray(detail)) {
          const messages = detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(' | ');
          this.errorMessage.set(messages);
        } else if (typeof detail === 'string') {
          this.errorMessage.set(detail);
        } else {
          this.errorMessage.set('Invalid email or password');
        }
      }
    });
  }
}