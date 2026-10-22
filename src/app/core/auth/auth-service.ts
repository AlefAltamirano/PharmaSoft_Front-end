import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Permiso, Sesion } from './auth.model';

const CLAVE_SESION = 'pharmasoft.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

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
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        this.sesionActual.set(sesion);
        this.programarExpiracion(sesion);
      })
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.limpiarTemporizador();
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesionActual.set(null);

    const queryParams: Record<string, string> = {};
    if (motivo === 'expirada') {
      queryParams['expirada'] = '1';
    }
    if (volverA && volverA !== '/login') {
      queryParams['returnUrl'] = volverA;
    }
    void this.router.navigate(['/login'], { queryParams });
  }

  token(): string | null {
    const sesion = this.sesionActual();
    if (!sesion || sesion.expiraEn <= Date.now()) {
      if (sesion) {
        this.cerrarSesion('expirada', this.router.url);
      }
      return null;
    }
    return sesion.token;
  }

  tienePermiso(permiso: Permiso): boolean {
    return this.token() !== null && this.sesionActual()?.permisos.includes(permiso) === true;
  }

  leerSesionGuardada(): Sesion | null {
    try {
      const guardada = sessionStorage.getItem(CLAVE_SESION);
      if (!guardada) {
        return null;
      }
      const sesion = JSON.parse(guardada) as Sesion;
      if (
        typeof sesion.token !== 'string' ||
        typeof sesion.expiraEn !== 'number' ||
        !Array.isArray(sesion.roles) ||
        !Array.isArray(sesion.permisos) ||
        sesion.expiraEn <= Date.now()
      ) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }

  private programarExpiracion(sesion: Sesion | null): void {
    this.limpiarTemporizador();
    if (!sesion) {
      return;
    }
    const demora = Math.max(0, sesion.expiraEn - Date.now());
    this.temporizador = setTimeout(() => this.cerrarSesion('expirada', this.router.url), demora);
  }

  private limpiarTemporizador(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }
}
