import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    this.toasts.update(current => [...current, newToast]);

    const duration = toast.duration ?? 4500;
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, title: string = 'Success') {
    this.show({ type: 'success', message, title });
  }

  error(message: string, title: string = 'Error') {
    this.show({ type: 'error', message, title });
  }

  warning(message: string, title: string = 'Notice') {
    this.show({ type: 'warning', message, title });
  }

  info(message: string, title: string = 'Information') {
    this.show({ type: 'info', message, title });
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
