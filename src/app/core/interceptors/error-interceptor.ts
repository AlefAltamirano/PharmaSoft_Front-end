import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const isApiRequest = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`);
  const isLogin = req.url === `${apiUrl}/auth/login`;

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest && error.status === 401 && !isLogin) {
        auth.cerrarSesion('expirada', router.url);
      } else if (isApiRequest && error.status === 403) {
        void router.navigate(['/acceso-denegado']);
      }
      return throwError(() => error);
    })
  );
};
