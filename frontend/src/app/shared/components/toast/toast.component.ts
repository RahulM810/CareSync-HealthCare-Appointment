import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div *ngFor="let toast of notificationService.toasts()"
           class="pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 transform transition-all duration-200 animate-slide-in"
           [ngClass]="{
             'bg-emerald-50 border-emerald-200 text-emerald-900': toast.type === 'success',
             'bg-rose-50 border-rose-200 text-rose-900': toast.type === 'error',
             'bg-amber-50 border-amber-200 text-amber-900': toast.type === 'warning',
             'bg-sky-50 border-sky-200 text-sky-900': toast.type === 'info'
           }">
        
        <!-- Icon -->
        <div class="shrink-0 mt-0.5">
          <svg *ngIf="toast.type === 'success'" class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg *ngIf="toast.type === 'error'" class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg *ngIf="toast.type === 'warning'" class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg *ngIf="toast.type === 'info'" class="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h4 *ngIf="toast.title" class="text-sm font-bold">{{ toast.title }}</h4>
          <p class="text-xs mt-0.5 leading-relaxed">{{ toast.message }}</p>
        </div>

        <!-- Dismiss -->
        <button (click)="notificationService.remove(toast.id)" class="text-slate-400 hover:text-slate-600 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  notificationService = inject(NotificationService);
}
