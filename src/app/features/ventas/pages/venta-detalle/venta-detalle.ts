import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({
  selector: 'app-venta-detalle',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './venta-detalle.html',
  styleUrl: './venta-detalle.css'
})
export class VentaDetalle implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);

  readonly id = input<string>();
  protected readonly venta = signal<Venta | null>(null);
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cargando = signal(true);
  protected readonly nueva = signal(false);
  protected readonly anulando = signal(false);

  ngOnInit(): void {
    const ventaId = Number(this.id());
    this.nueva.set(this.route.snapshot.queryParamMap.get('nueva') === '1');
    const imprimir = this.route.snapshot.queryParamMap.get('imprimir') === '1';
    this.ventaService.obtener(ventaId).subscribe({
      next: venta => {
        this.venta.set(venta);
        this.cargando.set(false);
        this.clienteService.obtener(venta.clienteId).subscribe({
          next: cliente => this.cliente.set(cliente),
          error: () => this.cliente.set(null)
        });
        if (imprimir) setTimeout(() => window.print(), 300);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }

  protected anularVenta(): void {
    const ventaActual = this.venta();
    if (!ventaActual || ventaActual.estado !== 'REGISTRADA' || this.anulando()) return;
    if (!window.confirm('¿Está seguro de que desea anular esta venta?')) return;

    this.anulando.set(true);
    this.error.set(null);
    this.ventaService.anular(ventaActual.id).subscribe({
      next: ventaAnulada => {
        this.venta.set(ventaAnulada);
        this.anulando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.anulando.set(false);
      }
    });
  }
}
