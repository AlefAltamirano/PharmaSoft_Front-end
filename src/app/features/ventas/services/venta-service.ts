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
      .set('tamanio', tamanio);
    if (filtro.clienteId) params = params.set('clienteId', filtro.clienteId);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);

    return this.http.get<PaginaResponse<Venta> | Venta[]>(`${this.url}/buscar`, { params }).pipe(
      map(respuesta => Array.isArray(respuesta)
        ? this.crearPagina(respuesta, pagina, tamanio)
        : respuesta)
    );
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
