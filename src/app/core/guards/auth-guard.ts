import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.sesion() ? true : inject(Router).createUrlTree(['/inicio']);
};

