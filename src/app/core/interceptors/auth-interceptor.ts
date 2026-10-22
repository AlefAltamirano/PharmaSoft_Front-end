import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  if (req.url !== apiUrl && !req.url.startsWith(`${apiUrl}/`)) return next(req);
  const token = auth.token();
  return next(token && !req.headers.has('Authorization')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req);
};
