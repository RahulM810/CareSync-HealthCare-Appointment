import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role } from '../models';

interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
  user_id: string;
  email: string;
  full_name: string;
  google_calendar_connected: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  token = signal<string | null>(localStorage.getItem('access_token'));
  
  isAuthenticated = computed(() => !!this.currentUser() || !!this.token());
  userRole = computed(() => this.currentUser()?.role || null);
  isPatient = computed(() => this.currentUser()?.role === 'PATIENT');
  isDoctor = computed(() => this.currentUser()?.role === 'DOCTOR');
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor() {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      this.token.set(savedToken);
      this.loadCurrentUser().subscribe();
    }
  }

  loadCurrentUser(): Observable<User | null> {
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) {
      this.currentUser.set(null);
      return of(null);
    }
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        this.handleAuthSuccess(res);
      })
    );
  }

  register(payload: { email: string; password: string; full_name: string; phone_number?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap(res => {
        this.handleAuthSuccess(res);
      })
    );
  }

  handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem('access_token', res.access_token);
    this.token.set(res.access_token);
    const user: User = {
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
      google_calendar_connected: res.google_calendar_connected
    };
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('access_token');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getGoogleAuthUrl(): Observable<{ auth_url: string }> {
    return this.http.get<{ auth_url: string }>(`${environment.apiUrl}/auth/google`);
  }
}