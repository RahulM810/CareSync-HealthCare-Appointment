import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Patient Routes
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/patient/dashboard/dashboard.component').then(m => m.PatientDashboardComponent)
      },
      {
        path: 'doctors',
        loadComponent: () => import('./features/patient/doctor-search/doctor-search.component').then(m => m.DoctorSearchComponent)
      },
      {
        path: 'book/:doctorId',
        loadComponent: () => import('./features/patient/booking/booking.component').then(m => m.BookingComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/patient/appointments/appointments.component').then(m => m.PatientAppointmentsComponent)
      },
      {
        path: 'appointments/:id',
        loadComponent: () => import('./features/patient/appointment-detail/appointment-detail.component').then(m => m.PatientAppointmentDetailComponent)
      }
    ]
  },

  // Doctor Routes
  {
    path: 'doctor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/doctor/dashboard/dashboard.component').then(m => m.DoctorDashboardComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/doctor/appointments/appointments.component').then(m => m.DoctorAppointmentsComponent)
      },
      {
        path: 'appointments/:id',
        loadComponent: () => import('./features/doctor/appointment-detail/appointment-detail.component').then(m => m.DoctorAppointmentDetailComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./features/doctor/schedule/schedule.component').then(m => m.DoctorScheduleComponent)
      }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'doctors',
        loadComponent: () => import('./features/admin/doctor-management/doctor-management.component').then(m => m.DoctorManagementComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/admin/appointment-overview/appointment-overview.component').then(m => m.AdminAppointmentsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/admin/notification-logs/notification-logs.component').then(m => m.NotificationLogsComponent)
      }
    ]
  },

  // Backward-compatible doctor list redirect
  { path: 'doctors', redirectTo: 'patient/doctors', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];