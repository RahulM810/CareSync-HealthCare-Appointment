import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrgencyLevel } from '../../../core/models';

@Component({
  selector: 'app-urgency-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-xs"
         [ngClass]="{
           'bg-red-50 text-red-700 border-red-200': level === 'High',
           'bg-amber-50 text-amber-700 border-amber-200': level === 'Medium',
           'bg-emerald-50 text-emerald-700 border-emerald-200': level === 'Low' || !level
         }">
      <span class="w-2 h-2 rounded-full relative flex items-center justify-center">
        <span *ngIf="level === 'High'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full w-2 h-2"
              [ngClass]="{
                'bg-red-500': level === 'High',
                'bg-amber-500': level === 'Medium',
                'bg-emerald-500': level === 'Low' || !level
              }"></span>
      </span>
      <span>{{ level || 'Low' }} Urgency</span>
    </div>
  `
})
export class UrgencyBadgeComponent {
  @Input() level: UrgencyLevel | string = 'Low';
}
