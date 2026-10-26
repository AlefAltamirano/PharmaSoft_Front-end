import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sesion, UsuarioPerfil } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;
  private temporizador: ReturnType<typeof setInterval> | null = null;

  readonly sesion = signal<Sesion | null>(this.leerSesion());
  readonly segundosRestantes = signal<number>(0);
  readonly avisoOculto = signal<boolean>(false);
  readonly porVencer = computed(() => {
    const sesion = this.sesion();
    const segundos = this.segundosRestantes();
    return segundos <= 120 && segundos > 0 && !!sesion && !this.avisoOculto();
  });
  readonly tiempoRestante = computed(() => {
    const segundos = this.segundosRestantes();
    const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
    const restantes = (segundos % 60).toString().padStart(2, '0');
    return `${minutos}:${restantes}`;
  });

  constructor() {
    const sesion = this.sesion();
    if (sesion) {
      this.iniciarTemporizador(sesion);
    }
  }

  obtenerPerfil(): Observable<UsuarioPerfil> {
    return this.http.get<UsuarioPerfil>(`${this.url}/me`);
  }

  cerrarSesion(): void {
    this.limpiarTemporizador();
    this.sesion.set(null);
    this.segundosRestantes.set(0);
    this.avisoOculto.set(false);
    localStorage.removeItem('pharma_sesion');
  }

  ocultarAviso(): void {
    this.avisoOculto.set(true);
  }

  establecerSesion(sesion: Sesion): void {
    this.limpiarTemporizador();
    this.sesion.set(sesion);
    this.avisoOculto.set(false);
    localStorage.setItem('pharma_sesion', JSON.stringify(sesion));
    this.iniciarTemporizador(sesion);
  }

  private iniciarTemporizador(sesion: Sesion): void {
    const actualizar = (): void => {
      const segundos = Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000));
      this.segundosRestantes.set(segundos);
      if (segundos === 0) {
        this.limpiarTemporizador();
      }
    };
    actualizar();
    this.temporizador = setInterval(actualizar, 1000);
  }

  private limpiarTemporizador(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  private leerSesion(): Sesion | null {
    const valor = localStorage.getItem('pharma_sesion');
    if (!valor) return null;
    try {
      return JSON.parse(valor) as Sesion;
    } catch {
      localStorage.removeItem('pharma_sesion');
      return null;
    }
  }
}

