import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';
import { SiPermisoDirective } from '../../../../shared/directives/si-permiso.directive';

@Component({
  selector: 'app-producto-list',
  imports: [CurrencyPipe, RouterLink, SiPermisoDirective],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css'
})
export class ProductoList implements OnInit {
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
  protected readonly productos = computed(() => {
    const contenido = this.resultado()?.contenido ?? [];
    const categoriaId = this.categoriaFiltro();
    return categoriaId === null ? contenido : contenido.filter(producto => producto.categoriaId === categoriaId);
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: categorias => this.categorias.set(categorias),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err))
    });
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService.listar(
      this.pagina(),
      this.tamanio(),
      this.ordenarPor(),
      this.direccion(),
      this.categoriaFiltro()
    ).subscribe({
      next: resultado => {
        this.resultado.set(resultado);
        this.pagina.set(resultado.pagina);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }

  protected irA(pagina: number): void {
    const totalPaginas = this.resultado()?.totalPaginas ?? 0;
    if (pagina < 0 || pagina >= totalPaginas) return;
    this.pagina.set(pagina);
    this.cargar();
  }

  protected cambiarTamanio(event: Event): void {
    this.tamanio.set(Number((event.target as HTMLSelectElement).value));
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
    this.pagina.set(0);
    this.cargar();
  }

  protected darDeBaja(producto: Producto): void {
    if (!producto.estado || !confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) return;
    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err))
    });
  }
}
