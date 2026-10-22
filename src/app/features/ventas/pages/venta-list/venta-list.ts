import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';
import { SiPermisoDirective } from '../../../../shared/directives/si-permiso.directive';

@Component({
  selector: 'app-venta-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink, SiPermisoDirective],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css'
})
export class VentaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly resultado = signal<PaginaResponse<Venta> | null>(null);
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtroAplicado = signal<FiltroVentas | null>(null);
  protected readonly form = this.fb.group({
    clienteId: [0],
    estado: ['' as EstadoVenta | ''],
    desde: [''],
    hasta: ['']
  });

  protected readonly ventas = computed(() => this.resultado()?.contenido ?? []);
  protected readonly totalPagina = computed(() =>
    this.ventas()
      .filter(venta => venta.estado === 'REGISTRADA')
      .reduce((total, venta) => total + venta.total, 0)
  );

  ngOnInit(): void {
    this.clienteService.listar().subscribe({
      next: clientes => this.clientes.set(clientes),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err))
    });
    this.buscar();
  }

  protected buscar(): void {
    const valores = this.form.getRawValue();
    const desde = this.fechaIso(valores.desde);
    const hasta = this.fechaIso(valores.hasta);
    if (valores.desde && !desde || valores.hasta && !hasta) {
      this.error.set('Las fechas deben tener el formato YYYY-MM-DD.');
      return;
    }
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta»');
      return;
    }
    const filtro: FiltroVentas = {
      clienteId: valores.clienteId || null,
      estado: valores.estado,
      desde: desde ?? '',
      hasta: hasta ?? ''
    };
    this.pagina.set(0);
    this.cargar(filtro);
  }

  protected irA(pagina: number): void {
    const resultado = this.resultado();
    if (!resultado || pagina < 0 || pagina >= resultado.totalPaginas) return;
    this.pagina.set(pagina);
    this.cargar(this.filtroAplicado() ?? { clienteId: null, estado: '', desde: '', hasta: '' });
  }

  protected imprimirConsulta(): void {
    window.print();
  }

  protected resumenFiltros(): string {
    const filtro = this.filtroAplicado();
    const cliente = filtro?.clienteId ?? 'todos';
    const estado = filtro?.estado || 'todos';
    const desde = filtro?.desde || 'sin fecha inicial';
    const hasta = filtro?.hasta || 'sin fecha final';
    const impresoEl = new Date().toLocaleDateString('es-PE');

    return `Filtros: cliente ${cliente}, estado ${estado}, desde ${desde} - ${hasta} - Impreso el ${impresoEl}`;
  }

  private cargar(filtro: FiltroVentas): void {
    this.cargando.set(true);
    this.error.set(null);
    this.filtroAplicado.set(filtro);
    this.ventaService.buscar(filtro, this.pagina(), this.tamanio()).subscribe({
      next: resultado => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }

  private fechaIso(valor: string | null | undefined): string | null {
    if (!valor) return null;
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!coincidencia) return null;
    const fecha = new Date(`${valor}T00:00:00Z`);
    return Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== valor ? null : valor;
  }
}
