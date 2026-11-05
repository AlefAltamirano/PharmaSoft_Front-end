import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, TimeoutError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { Permiso, UsuarioPerfil } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

const MODULOS: Record<string, Permiso[]> = {
  Catálogo: ['CATALOGO_LEER', 'CATALOGO_ESCRIBIR'],
  Clientes: ['CLIENTES_LEER', 'CLIENTES_ESCRIBIR'],
  Ventas: ['VENTAS_LEER', 'VENTAS_REGISTRAR'],
  Reportes: ['REPORTES_VER'],
  Usuarios: ['USUARIOS_ADMINISTRAR']
};

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css'
})
export class MiCuenta implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly perfil = signal<UsuarioPerfil | null>(null);
  protected readonly permisosDiferentes = signal(false);
  protected readonly modulos = Object.entries(MODULOS);

  ngOnInit(): void {
    this.auth.obtenerPerfil().pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.error.set(null);
        this.validarPermisosSesion(perfil);
      },
      error: (err: unknown) => {
        const mensaje = err instanceof TimeoutError
          ? 'El servidor tardó demasiado en responder. Intente nuevamente.'
          : err instanceof HttpErrorResponse
            ? mensajeError(err)
            : 'No se pudo cargar el perfil. Intente nuevamente.';
        this.error.set(mensaje);
      }
    });
  }

  tienePermiso(permisos: string[], permiso: Permiso): boolean {
    return permisos.includes(permiso);
  }

  private validarPermisosSesion(perfil: UsuarioPerfil): void {
    const actuales = this.auth.sesionActual()?.permisos ?? [];
    this.permisosDiferentes.set(
      [...actuales].sort().join('|') !== [...perfil.permisos].sort().join('|')
    );
  }
}
