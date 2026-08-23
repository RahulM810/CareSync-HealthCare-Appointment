import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved ? saved === 'dark' : prefersDark;

    this.isDarkMode.set(initialDark);
    this.applyTheme(initialDark);

    effect(() => {
      const dark = this.isDarkMode();
      this.applyTheme(dark);
    });
  }

  toggleTheme() {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean) {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
