import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[];
  const user = auth.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles && allowedRoles.includes(user.role)) {
    return true;
  }

  // Redirect based on actual role
  if (user.role === 'DOCTOR') {
    router.navigate(['/doctor/dashboard']);
  } else if (user.role === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/patient/dashboard']);
  }

  return false;
};
