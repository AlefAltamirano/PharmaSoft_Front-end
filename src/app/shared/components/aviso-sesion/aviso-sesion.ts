import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-aviso-sesion',
  standalone: true,
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css'
})
export class AvisoSesion {
  protected readonly auth = inject(AuthService);
  protected readonly oculto = signal(false);

  formatear(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const restantes = segundos % 60;
    return `${minutos}:${restantes.toString().padStart(2, '0')}`;
  }

  ocultar(): void {
    this.oculto.set(true);
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
