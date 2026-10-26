import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Permiso, Sesion, UsuarioResponseDTO } from './auth.model';

const CLAVE_SESION = 'pharmasoft.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  readonly sesion = this.sesionActual.asReadonly();
  readonly segundosRestantes = signal(0);
  readonly autenticado = computed(() => {
    const sesion = this.sesionActual();
    return sesion !== null && sesion.expiraEn > Date.now();
  });
  readonly porVencer = computed(() =>
    this.autenticado() && this.segundosRestantes() > 0 && this.segundosRestantes() <= 120
  );

  constructor() {
    this.iniciarTemporizador(this.sesionActual());
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
        this.iniciarTemporizador(sesion);
      })
    );
  }

  obtenerPerfil(): Observable<UsuarioResponseDTO> {
    return this.http.get<UsuarioResponseDTO>(`${environment.apiUrl}/auth/me`);
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.detenerTemporizador();
    this.sesionActual.set(null);
    this.segundosRestantes.set(0);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      // sessionStorage may be unavailable in non-browser environments.
    }

    const destino = volverA && volverA.startsWith('/') && !volverA.startsWith('//')
      ? volverA
      : undefined;
    void this.router.navigate(['/login'], {
      queryParams: {
        ...(motivo === 'expirada' ? { expirada: '1' } : {}),
        ...(destino && destino !== '/login' ? { returnUrl: destino } : {})
      }
    });
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
    const permisos = this.sesionActual()?.permisos ?? [];
    return permisos.some(actual => actual === permiso);
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const valor = sessionStorage.getItem(CLAVE_SESION);
      if (!valor) {
        return null;
      }
      const sesion = JSON.parse(valor) as Sesion;
      if (
        typeof sesion.token !== 'string' ||
        typeof sesion.expiraEn !== 'number' ||
        typeof sesion.username !== 'string' ||
        !Array.isArray(sesion.roles) ||
        !Array.isArray(sesion.permisos) ||
        sesion.expiraEn <= Date.now()
      ) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      try {
        sessionStorage.removeItem(CLAVE_SESION);
      } catch {
        // Ignore storage cleanup failures.
      }
      return null;
    }
  }

  private guardarSesion(sesion: Sesion): void {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // The in-memory signal remains the source of truth for the current tab.
    }
  }

  private iniciarTemporizador(sesion: Sesion | null): void {
    this.detenerTemporizador();
    if (!sesion) {
      this.segundosRestantes.set(0);
      return;
    }
    this.actualizarSegundos(sesion);
    this.temporizador = setInterval(() => this.actualizarSegundos(sesion), 1000);
  }

  private actualizarSegundos(sesion: Sesion): void {
    const segundos = Math.max(0, Math.ceil((sesion.expiraEn - Date.now()) / 1000));
    this.segundosRestantes.set(segundos);
    if (segundos === 0) {
      this.detenerTemporizador();
      this.cerrarSesion('expirada', this.router.url);
    }
  }

  private detenerTemporizador(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }
}
