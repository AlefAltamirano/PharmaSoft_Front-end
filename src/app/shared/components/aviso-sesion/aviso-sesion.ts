import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-aviso-sesion',
  imports: [],
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css'
})
export class AvisoSesion {
  protected readonly authService = inject(AuthService);

  protected cerrarSesion(): void {
    this.authService.cerrarSesion();
  }

  protected ocultarAviso(): void {
    this.authService.ocultarAviso();
  }
}

