import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { mensajeError } from '../../../../core/utils/http-error';
import { VentaPorCategoria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-por-categoria',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './ventas-por-categoria.html',
  styleUrl: './ventas-por-categoria.css'
})
export class VentasPorCategoria implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reporteService = inject(ReporteService);

  protected readonly reporte = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtroAplicado = signal<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  protected readonly form = this.fb.group({
    desde: [''],
    hasta: ['']
  });

  ngOnInit(): void {
    this.buscar();
  }

  protected buscar(): void {
    const valores = this.form.getRawValue();
    const desde = this.fechaIso(valores.desde);
    const hasta = this.fechaIso(valores.hasta);

    if ((valores.desde && !desde) || (valores.hasta && !hasta)) {
      this.error.set('Las fechas deben tener el formato YYYY-MM-DD.');
      return;
    }
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }

    this.filtroAplicado.set({ desde: desde ?? '', hasta: hasta ?? '' });
    this.cargar(desde ?? undefined, hasta ?? undefined);
  }

  protected imprimirConsulta(): void {
    window.print();
  }

  protected totalCantidad(): number {
    return this.reporte().reduce((total, item) => total + item.cantidadVendida, 0);
  }

  protected totalMonto(): number {
    return this.reporte().reduce((total, item) => total + item.montoTotal, 0);
  }

  protected resumenFiltros(): string {
    const filtro = this.filtroAplicado();
    return `Filtros: desde ${filtro.desde || 'sin fecha inicial'} - ${filtro.hasta || 'sin fecha final'} - Impreso el ${new Date().toLocaleDateString('es-PE')}`;
  }

  private cargar(desde?: string, hasta?: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ventasPorCategoria(desde, hasta).subscribe({
      next: reporte => {
        this.reporte.set(reporte);
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
    return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor ? null : valor;
  }
}

