import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permiso } from '../auth/auth.model';
import { AuthService } from '../auth/auth-service';

export const permisoGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const permiso = route.data['permiso'] as Permiso | undefined;
  return !permiso || auth.tienePermiso(permiso)
    ? true
    : inject(Router).createUrlTree(['/acceso-denegado']);
};
