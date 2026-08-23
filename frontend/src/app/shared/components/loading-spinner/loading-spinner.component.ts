import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center" [ngClass]="containerClass">
      <div class="relative w-10 h-10">
        <div class="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin"></div>
      </div>
      <p *ngIf="message" class="mt-3 text-sm font-medium text-slate-500">{{ message }}</p>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Loading...';
  @Input() containerClass: string = '';
}
