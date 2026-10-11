import { Routes } from '@angular/router';
import { VentaDetalle } from './pages/venta-detalle/venta-detalle';
import { VentaForm } from './pages/venta-form/venta-form';
import { VentaList } from './pages/venta-list/venta-list';

export const VENTAS_ROUTES: Routes = [
  { path: '', component: VentaList, title: 'Ventas' },
  { path: 'nueva', component: VentaForm, title: 'Nueva venta' },
  { path: ':id', component: VentaDetalle, title: 'Comprobante de venta' }
];
