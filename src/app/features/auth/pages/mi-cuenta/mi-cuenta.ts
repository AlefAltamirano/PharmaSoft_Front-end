import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth-service';
import { Permiso, UsuarioResponseDTO } from '../../../../core/auth/auth.model';
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
  protected readonly perfil = signal<UsuarioResponseDTO | null>(null);
  protected readonly permisosDiferentes = signal(false);
  protected readonly modulos = Object.entries(MODULOS);

  ngOnInit(): void {
    this.auth.obtenerPerfil().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.permisosDiferentes.set(this.permisosCambiaron(perfil.permisos));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }

  tienePermiso(permisos: Permiso[], permiso: Permiso): boolean {
    return permisos.includes(permiso);
  }

  private permisosCambiaron(permisos: Permiso[]): boolean {
    const actuales = this.auth.sesionActual()?.permisos ?? [];
    return [...actuales].sort().join('|') !== [...permisos].sort().join('|');
  }
}
