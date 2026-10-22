import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Permiso, Sesion } from './auth.model';

const CLAVE_SESION = 'pharmasoft.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => {
    const sesion = this.sesionActual();
    return sesion !== null && sesion.expiraEn > Date.now();
  });

  constructor() {
    this.programarExpiracion(this.sesionActual());
  }

  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      map(respuesta => ({
        token: respuesta.token,
        expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
        username: respuesta.username,
        nombreCompleto: respuesta.nombreCompleto,
        roles: respuesta.roles,
        permisos: respuesta.permisos
      })),
      tap(sesion => {
        this.guardarSesion(sesion);
        this.sesionActual.set(sesion);
        this.programarExpiracion(sesion);
      })
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
    }
    this.sesionActual.set(null);
    const destino = volverA && volverA.startsWith('/') && !volverA.startsWith('//')
      ? volverA
      : undefined;
    const queryParams = {
      ...(motivo === 'expirada' ? { expirada: '1' } : {}),
      ...(destino && destino !== '/login' ? { returnUrl: destino } : {})
    };
    void this.router.navigate(['/login'], { queryParams });
  }

  token(): string | null {
    const sesion = this.sesionActual();
    if (!sesion || sesion.expiraEn <= Date.now()) {
      if (sesion) this.cerrarSesion('expirada', this.router.url);
      return null;
    }
    return sesion.token;
  }

  tienePermiso(permiso: Permiso): boolean {
    const requerido = permiso.trim().toUpperCase();
    const permisos = this.sesionActual()?.permisos ?? [];
    return permisos.some(actual => {
      const concedido = actual.trim().toUpperCase();
      return concedido === '*' || concedido === requerido ||
        (concedido.endsWith('_*') && requerido.startsWith(concedido.slice(0, -1)));
    });
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const valor = sessionStorage.getItem(CLAVE_SESION);
      if (!valor) return null;
      const sesion = JSON.parse(valor) as Sesion;
      if (!sesion.token || !Number.isFinite(sesion.expiraEn) || sesion.expiraEn <= Date.now()) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return {
        ...sesion,
        roles: Array.isArray(sesion.roles) ? sesion.roles : [],
        permisos: Array.isArray(sesion.permisos) ? sesion.permisos : []
      };
    } catch {
      try { sessionStorage.removeItem(CLAVE_SESION); } catch { }
      return null;
    }
  }

  private guardarSesion(sesion: Sesion): void {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
    }
  }

  private programarExpiracion(sesion: Sesion | null): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    if (!sesion) return;
    const demora = Math.max(0, sesion.expiraEn - Date.now());
    this.temporizador = setTimeout(() => this.cerrarSesion('expirada', this.router.url), demora);
  }
}
