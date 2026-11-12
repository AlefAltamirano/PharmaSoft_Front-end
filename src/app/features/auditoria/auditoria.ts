import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PaginaResponse } from '../../core/models/pagina-response';
import { mensajeError } from '../../core/utils/http-error';
import { Paginador } from '../../shared/components/paginador/paginador';
interface Evento {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string;
  requestId: string;
}
@Component({
  selector: 'app-auditoria',
  imports: [DatePipe, ReactiveFormsModule, Paginador],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly usuario = input('');
  readonly accion = input('');
  readonly desde = input('');
  readonly hasta = input('');
  protected readonly acciones = [
    'VENTA_REGISTRADA',
    'PRECIO_MODIFICADO',
    'PRODUCTO_ELIMINADO',
    'LOGIN_EXITOSO',
    'LOGIN_FALLIDO',
    'CLIENTE_REGISTRADO',
    'VENTA_ANULADA',
  ];
  protected readonly form = this.fb.group({
    usuario: [''],
    accion: [''],
    desde: [''],
    hasta: [''],
  });
  protected readonly validacion = signal<string | null>(null);
  protected readonly recurso = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      usuario: this.usuario(),
      accion: this.accion(),
      desde: this.desde(),
      hasta: this.hasta(),
    }),
    stream: ({ params }) => {
      let p = new HttpParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v != null) p = p.set(k, v);
      }
      return this.http.get<PaginaResponse<Evento>>(`${environment.apiUrl}/auditoria`, {
        params: p,
      });
    },
  });
  protected readonly resultado = linkedSignal<
    PaginaResponse<Evento> | undefined,
    PaginaResponse<Evento> | undefined
  >({ source: () => this.recurso.value(), computation: (n, p) => n ?? p?.value });
  protected readonly error = computed(
    () =>
      this.validacion() ||
      (this.recurso.error() ? mensajeError(this.recurso.error() as HttpErrorResponse) : null),
  );
  constructor() {
    effect(() =>
      this.form.patchValue(
        {
          usuario: this.usuario(),
          accion: this.accion(),
          desde: this.desde(),
          hasta: this.hasta(),
        },
        { emitEvent: false },
      ),
    );
  }
  protected buscar() {
    const f = this.form.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.validacion.set('La fecha desde no puede superar hasta');
      return;
    }
    this.validacion.set(null);
    void this.router.navigate([], {
      queryParams: { ...f, pagina: 0 },
      queryParamsHandling: 'merge',
    });
  }
  protected irA(pagina: number) {
    void this.router.navigate([], { queryParams: { pagina }, queryParamsHandling: 'merge' });
  }
  protected cambiarTamanio(tamanio: number) {
    void this.router.navigate([], {
      queryParams: { tamanio, pagina: 0 },
      queryParamsHandling: 'merge',
    });
  }
}
