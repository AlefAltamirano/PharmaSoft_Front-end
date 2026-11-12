import { debounceTime,distinctUntilChanged,switchMap,startWith,catchError,of } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
import { redondear } from '../../../../core/utils/numeros';
import { VentaRequest } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

type DetalleForm = FormGroup<{
  productoId: FormControl<number>;
  cantidad: FormControl<number>;
}>;

@Component({
  selector: 'app-venta-form',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './venta-form.html',
  styleUrl: './venta-form.css'
})
export class VentaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly ventaService = inject(VentaService);
  private readonly router = inject(Router);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly buscando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly buscarCliente = new FormControl('', { nonNullable: true });
  protected readonly buscarProducto = new FormControl('', { nonNullable: true });
  protected readonly form = this.fb.group({
    clienteId: [0, [Validators.required, Validators.min(1)]],
    detalles: new FormArray<DetalleForm>([])
  });

  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue()
  });
  private readonly textoCliente = toSignal(this.buscarCliente.valueChanges, { initialValue: '' });
  private readonly textoProducto = toSignal(this.buscarProducto.valueChanges, { initialValue: '' });

  protected readonly clientesCoincidentes = computed(() =>
    this.clientes()
      .filter(cliente => coincide(this.textoCliente(), cliente.dni, cliente.nombres, cliente.apellidos))
      .slice(0, 6)
  );

  protected readonly productosCoincidentes = computed(() =>
    this.productos()
      .filter(producto => producto.estado && coincide(this.textoProducto(), producto.nombre))
      .slice(0, 6)
  );

  protected readonly lineas = computed(() => {
    const valores = this.valores();
    return (valores.detalles ?? []).map(detalle => {
      const productoId = detalle.productoId ?? 0;
      const cantidad = detalle.cantidad ?? 0;
      const producto = this.productos().find(item => item.id === productoId);
      const subtotal = redondear((producto?.precio ?? 0) * cantidad);
      return { productoId, cantidad, producto, subtotal };
    });
  });

  protected readonly total = computed(() =>
    redondear(this.lineas().reduce((suma, linea) => suma + linea.subtotal, 0))
  );

  protected readonly excedeStock = computed(() =>
    this.lineas().some(linea => linea.producto !== undefined && linea.cantidad > linea.producto.stock)
  );

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find(cliente => cliente.id === this.valores().clienteId)
  );

  constructor(){
    this.buscarCliente.valueChanges.pipe(startWith(''),debounceTime(300),distinctUntilChanged(),switchMap(texto=>this.clienteService.buscar(texto).pipe(catchError(()=>of([])))),takeUntilDestroyed()).subscribe(rows=>this.clientes.set(rows));
    this.buscarProducto.valueChanges.pipe(startWith(''),debounceTime(300),distinctUntilChanged(),switchMap(texto=>this.productoService.buscar(texto).pipe(catchError(()=>of([])))),takeUntilDestroyed()).subscribe(rows=>this.productos.update(actuales=>{const seleccionados=actuales.filter(p=>this.form.controls.detalles.controls.some(d=>d.controls.productoId.value===p.id));return [...seleccionados,...rows.filter(p=>!seleccionados.some(a=>a.id===p.id))];}));
  }
  ngOnInit():void {}

  protected seleccionarCliente(cliente: Cliente): void {
    this.form.controls.clienteId.setValue(cliente.id);
    this.buscarCliente.setValue(`${cliente.nombres} ${cliente.apellidos}`);
  }

  protected agregarProducto(producto: Producto): void {
    const existente = this.form.controls.detalles.controls.find(
      detalle => detalle.controls.productoId.value === producto.id
    );
    if (existente) {
      existente.controls.cantidad.setValue(existente.controls.cantidad.value + 1);
    } else {
      this.form.controls.detalles.push(this.crearDetalle(producto.id));
    }
    this.buscarProducto.setValue('');
  }

  protected agregarPrimerProducto(event: Event): void {
    event.preventDefault();
    const producto = this.productosCoincidentes()[0];
    if (producto) this.agregarProducto(producto);
  }

  protected quitarDetalle(indice: number): void {
    this.form.controls.detalles.removeAt(indice);
  }

  protected validarYConfirmar(): void {
    if (this.form.invalid || !this.form.controls.detalles.length || this.excedeStock()) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmando.set(true);
  }

  protected volverAlFormulario(): void {
    this.confirmando.set(false);
  }

  protected guardar(): void {
    if (this.guardando() || this.form.invalid || !this.form.controls.detalles.length || this.excedeStock()) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const dto: VentaRequest = {
      clienteId: valores.clienteId ?? 0,
      detalles: (valores.detalles ?? []).map(detalle => ({
        productoId: detalle.productoId ?? 0,
        cantidad: detalle.cantidad ?? 0
      }))
    };
    this.guardando.set(true);
    this.ventaService.registrar(dto).subscribe({
      next: venta => this.router.navigate(['/ventas', venta.id], {
        queryParams: { nueva: 1, imprimir: 1 }
      }),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.confirmando.set(false);
        this.error.set(mensajeError(err));
      }
    });
  }

  private crearDetalle(productoId: number): DetalleForm {
    return this.fb.group({
      productoId: [productoId, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
    });
  }
}
