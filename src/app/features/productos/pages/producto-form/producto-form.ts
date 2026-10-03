import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { Producto, ProductoRequest } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

type CategoriaOpcion = Categoria & { etiqueta: string };

@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly categoriaService = inject(CategoriaService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly producto = signal<Pick<Producto, 'categoriaId'> | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    estado: [true],
    categoriaId: [0, [Validators.required, Validators.min(1)]]
  });

  private readonly categoriaId = toSignal(this.form.controls.categoriaId.valueChanges, {
    initialValue: this.form.controls.categoriaId.value
  });

  protected readonly opciones = computed<CategoriaOpcion[]>(() => {
    const categorias = this.categorias();
    const categoriaPropiaId = this.producto()?.categoriaId;
    return categorias
      .filter(categoria => categoria.estado || categoria.id === categoriaPropiaId)
      .map(categoria => ({
        ...categoria,
        etiqueta: categoria.estado ? categoria.nombre : `${categoria.nombre} (inactiva)`
      }));
  });

  protected readonly categoriaInactiva = computed(() => {
    const categoria = this.categorias().find(c => c.id === this.categoriaId());
    return !!categoria && !categoria.estado;
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    this.cargando.set(true);
    if (id) {
      forkJoin({
        categorias: this.categoriaService.listar(),
        producto: this.productoService.obtener(Number(id))
      }).subscribe({
        next: ({ categorias, producto }) => {
          this.categorias.set(categorias);
          this.producto.set(producto);
          this.form.setValue({
            nombre: producto.nombre,
            precio: producto.precio,
            stock: producto.stock,
            estado: producto.estado,
            categoriaId: producto.categoriaId
          });
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        }
      });
      return;
    }

    this.categoriaService.listar().subscribe({
      next: categorias => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      }
    });
  }

  protected guardar(): void {
    if (this.form.invalid || this.categoriaInactiva()) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dto: ProductoRequest = {
      nombre: valores.nombre.trim(),
      precio: valores.precio,
      stock: valores.stock,
      estado: valores.estado,
      categoriaId: valores.categoriaId
    };
    const id = this.id();
    const peticion = id
      ? this.productoService.actualizar(Number(id), dto)
      : this.productoService.crear(dto);

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      }
    });
  }
}
