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

    return this.http.get<PaginaResponse<Venta>>(`${this.url}/buscar`, {params});
  }
  private fechaIso(valor:string|null|undefined):string|null {return valor||null;}
}
