import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
interface Fila { productoId: number; productoNombre: string; categoriaNombre: string; cantidadVendida: number; montoTotal: number; }
@Component({selector:'app-mas-vendidos', imports:[CurrencyPipe], templateUrl:'./mas-vendidos.html'})
export class MasVendidos {
 readonly filas=signal<Fila[]>([]); readonly error=signal(false); readonly cargando=signal(true);
 constructor() { inject(HttpClient).get<Fila[]>(`${environment.apiUrl}/reportes/productos-mas-vendidos`).subscribe({next: filas=>{this.filas.set(filas);this.cargando.set(false);}, error:()=>{this.error.set(true);this.cargando.set(false);}}); }
}
