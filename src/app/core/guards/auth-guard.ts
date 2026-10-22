import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.autenticado()) {
    return true;
  }
  const returnUrl = state.url === '/' ? '/inicio' : state.url;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl } });
};

export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).autenticado()
    ? inject(Router).createUrlTree(['/inicio'])
    : true;
