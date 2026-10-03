import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import {
  Direccion,
  OrdenProducto,
  Producto
} from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css'
})
export class ProductoList implements OnInit, OnDestroy {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenProducto>('nombre');
  protected readonly direccion = signal<Direccion>('asc');
  protected readonly resultado = signal<PaginaResponse<Producto> | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly categoriaFiltro = signal<number | null>(null);
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly productos = computed(() => {
    const resultado = this.resultado();
    if (!resultado) {
      return [];
    }

    const productos = resultado.totalElementos === resultado.contenido.length &&
      resultado.totalPaginas > 1
      ? resultado.contenido.slice(
        resultado.pagina * resultado.tamanio,
        (resultado.pagina + 1) * resultado.tamanio
      )
      : resultado.contenido;
    const categoriaId = this.categoriaFiltro();
    return categoriaId === null
      ? productos
      : productos.filter(producto => producto.categoriaId === categoriaId);
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: categorias => this.categorias.set(categorias),
      error: (err: HttpErrorResponse) => this.mostrarError(mensajeError(err))
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.limpiarTemporizadorError();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.limpiarError();
    this.productoService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: resultado => {
          this.resultado.set(resultado);
          this.pagina.set(resultado.pagina);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.mostrarError(mensajeError(err));
          this.cargando.set(false);
        }
      });
  }

  protected irA(pagina: number): void {
  const resultado = this.resultado();
  const totalPaginas = resultado?.totalPaginas ?? 0;

  if (pagina < 0 || totalPaginas === 0 || pagina >= totalPaginas) {
    return;
  }

  this.pagina.set(pagina);
  this.cargar();
}

  protected cambiarTamanio(event: Event): void {
    const tamanio = Number((event.target as HTMLSelectElement).value);
    this.tamanio.set(tamanio);
    this.pagina.set(0);
    this.cargar();
  }

  protected ordenar(campo: OrdenProducto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update(actual => actual === 'asc' ? 'desc' : 'asc');
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.pagina.set(0);
    this.cargar();
  }

  protected filtrarPorCategoria(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.categoriaFiltro.set(valor ? Number(valor) : null);
  }

  protected darDeBaja(producto: Producto): void {
    if (!producto.estado || !confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) {
      return;
    }
    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.mostrarError(mensajeError(err))
    });
  }

  private mostrarError(mensaje: string): void {
    this.limpiarTemporizadorError();
    this.error.set(mensaje);
    this.errorTimer = setTimeout(() => {
      this.error.set(null);
      this.errorTimer = null;
    }, 5000);
  }

  private limpiarError(): void {
    this.limpiarTemporizadorError();
    this.error.set(null);
  }

  private limpiarTemporizadorError(): void {
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
  }
}
