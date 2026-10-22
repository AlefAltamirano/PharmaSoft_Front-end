import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { EstadoVenta, FiltroVentas, Venta, VentaRequest } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas`;

  registrar(dto: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.url, dto);
  }

  anular(id: number): Observable<Venta> {
    return this.http.put<Venta>(`${this.url}/${id}/anular`, {});
  }

  obtener(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.url}/${id}`);
  }

  buscar(filtro: FiltroVentas, pagina: number, tamanio: number): Observable<PaginaResponse<Venta>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'fecha')
      .set('direccion', 'desc');
    if (filtro.clienteId !== null) params = params.set('clienteId', filtro.clienteId);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    const desde = this.fechaIso(filtro.desde);
    const hasta = this.fechaIso(filtro.hasta);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<Venta[]>(this.url, { params }).pipe(
      map(ventas => this.crearPagina(this.filtrar(ventas, filtro), pagina, tamanio))
    );
  }

  private filtrar(ventas: Venta[], filtro: FiltroVentas): Venta[] {
    const desde = this.fechaIso(filtro.desde);
    const hasta = this.fechaIso(filtro.hasta);
    return ventas.filter(venta => {
      const fecha = venta.fecha.slice(0, 10);
      return (filtro.clienteId === null || venta.clienteId === filtro.clienteId) &&
        (!filtro.estado || venta.estado === filtro.estado) &&
        (!desde || fecha >= desde) &&
        (!hasta || fecha <= hasta);
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

  private crearPagina(ventas: Venta[], pagina: number, tamanio: number): PaginaResponse<Venta> {
    const inicio = pagina * tamanio;
    const contenido = ventas.slice(inicio, inicio + tamanio);
    return {
      contenido,
      pagina,
      tamanio,
      totalElementos: ventas.length,
      totalPaginas: ventas.length ? Math.ceil(ventas.length / tamanio) : 0,
      ultima: inicio + tamanio >= ventas.length
    };
  }
}
