import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth-service';
import { UsuarioPerfil } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

interface ModuloPermisos {
  nombre: string;
  permisos: string[];
}

@Component({
  selector: 'app-mi-cuenta',
  imports: [],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css'
})
export class MiCuenta implements OnInit {
  private readonly authService = inject(AuthService);

  protected readonly perfil = signal<UsuarioPerfil | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly permisosActualizados = signal(true);
  protected readonly modulos = computed<ModuloPermisos[]>(() => [
    { nombre: 'Catálogo', permisos: ['CATALOGO_LEER', 'CATALOGO_ESCRIBIR'] },
    { nombre: 'Clientes', permisos: ['CLIENTES_LEER', 'CLIENTES_ESCRIBIR'] },
    { nombre: 'Ventas', permisos: ['VENTAS_LEER', 'VENTAS_REGISTRAR'] },
    { nombre: 'Reportes', permisos: ['REPORTES_VER'] },
    { nombre: 'Usuarios', permisos: ['USUARIOS_ADMINISTRAR'] }
  ]);

  ngOnInit(): void {
    this.cargarPerfil();
  }

  protected tienePermiso(permiso: string): boolean {
    return this.perfil()?.permisos.includes(permiso) ?? false;
  }

  private cargarPerfil(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.authService.obtenerPerfil().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        const permisosSesion = [...(this.authService.sesion()?.permisos ?? [])].sort();
        const permisosPerfil = [...perfil.permisos].sort();
        this.permisosActualizados.set(permisosSesion.length === permisosPerfil.length &&
          permisosSesion.every((permiso, indice) => permiso === permisosPerfil[indice]));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }
}

