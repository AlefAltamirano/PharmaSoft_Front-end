import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { VentaService } from '../../services/venta-service';
import { Venta, EstadoVenta, FiltroVentas } from '../../models/venta.model';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermisoDirective } from '../../../../shared/directives/si-permiso.directive';
import { Paginador } from '../../../../shared/components/paginador/paginador';
@Component({
  selector: 'app-venta-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink, SiPermisoDirective, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList {
  private service = inject(VentaService);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly clienteId = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly estado = input<EstadoVenta | ''>('');
  readonly desde = input('');
  readonly hasta = input('');
  protected readonly clientes = toSignal(inject(ClienteService).listar(), { initialValue: [] });
  protected readonly form = this.fb.group({
    clienteId: [0],
    estado: ['' as EstadoVenta | ''],
    desde: [''],
    hasta: [''],
  });
  protected readonly validacion = signal<string | null>(null);
  protected readonly filtroAplicado = computed<FiltroVentas>(() => ({
    clienteId: this.clienteId() || null,
    estado: this.estado(),
    desde: this.desde(),
    hasta: this.hasta(),
  }));
  protected readonly recurso = rxResource({
    params: () => ({
      filtro: this.filtroAplicado(),
      pagina: this.pagina(),
      tamanio: this.tamanio(),
    }),
    stream: ({ params: p }) => this.service.buscar(p.filtro, p.pagina, p.tamanio),
  });
  protected readonly resultado = linkedSignal<
    PaginaResponse<Venta> | undefined,
    PaginaResponse<Venta> | undefined
  >({ source: () => this.recurso.value(), computation: (n, p) => n ?? p?.value });
  protected readonly ventas = computed(() => this.resultado()?.contenido ?? []);
  protected readonly totalPagina = computed(() =>
    this.ventas()
      .filter((v) => v.estado === 'REGISTRADA')
      .reduce((n, v) => n + v.total, 0),
  );
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(
    () =>
      this.validacion() ||
      (this.recurso.error() ? mensajeError(this.recurso.error() as HttpErrorResponse) : null),
  );
  constructor() {
    effect(() =>
      this.form.patchValue(
        {
          clienteId: this.clienteId(),
          estado: this.estado(),
          desde: this.desde(),
          hasta: this.hasta(),
        },
        { emitEvent: false },
      ),
    );
  }
  protected buscar() {
    let f = this.form.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.validacion.set('La fecha desde no puede superar hasta');
      return;
    }
    this.validacion.set(null);
    void this.router.navigate([], {
      queryParams: { ...f, clienteId: f.clienteId || null, pagina: 0 },
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
  protected imprimirConsulta() {
    window.print();
  }
  protected resumenFiltros() {
    return `Fechas ${this.desde() || 'todas'} - ${this.hasta() || 'todas'}`;
  }
}
