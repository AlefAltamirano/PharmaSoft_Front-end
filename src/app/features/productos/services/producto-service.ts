import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import {
  Direccion,
  OrdenProducto,
  Producto,
  ProductoRequest
} from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  listar(
    pagina: number,
    tamanio: number,
    ordenarPor: OrdenProducto,
    direccion: Direccion
  ): Observable<PaginaResponse<Producto>> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', ordenarPor)
      .set('direccion', direccion);

    return this.http.get<PaginaResponse<Producto> | ProductoApi[]>(this.url, { params }).pipe(
      map(respuesta => Array.isArray(respuesta)
        ? this.crearPagina(respuesta, pagina, tamanio)
        : {
          ...respuesta,
          contenido: respuesta.contenido.map(producto => this.normalizar(producto as ProductoApi))
        })
    );
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<ProductoApi>(`${this.url}/${id}`).pipe(
      map(producto => this.normalizar(producto))
    );
  }

  crear(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<ProductoApi>(this.url, dto).pipe(
      map(producto => this.normalizar(producto))
    );
  }

  actualizar(id: number, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<ProductoApi>(`${this.url}/${id}`, dto).pipe(
      map(producto => this.normalizar(producto))
    );
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  private crearPagina(productos: ProductoApi[], pagina: number, tamanio: number): PaginaResponse<Producto> {
    return {
      contenido: productos.map(producto => this.normalizar(producto)),
      pagina,
      tamanio,
      totalElementos: productos.length,
      totalPaginas: productos.length ? Math.ceil(productos.length / tamanio) : 0,
      ultima: true
    };
  }

  private normalizar(producto: ProductoApi): Producto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      estado: producto.estado,
      categoriaId: producto.categoriaId ?? producto.categoria?.id ?? 0,
      categoriaNombre: producto.categoriaNombre ?? producto.categoria?.nombre ?? 'Sin categoría',
      fechaCreacion: producto.fechaCreacion,
      fechaModificacion: producto.fechaModificacion
    };
  }
}

interface ProductoApi extends Omit<Producto, 'categoriaId' | 'categoriaNombre'> {
  categoriaId?: number;
  categoriaNombre?: string;
  categoria?: { id: number; nombre: string };
}
