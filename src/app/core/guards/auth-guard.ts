import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.autenticado()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).autenticado()
    ? inject(Router).createUrlTree(['/inicio'])
    : true;
