import { Routes } from '@angular/router';
import { ProductoForm } from './pages/producto-form/producto-form';
import { ProductoList } from './pages/producto-list/producto-list';
import { permisoGuard } from '../../core/guards/permiso-guard';

export const PRODUCTOS_ROUTES: Routes = [
  { path: '', component: ProductoList, title: 'Productos', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_LEER' } },
  { path: 'nuevo', component: ProductoForm, title: 'Nuevo producto', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' } },
  { path: ':id/editar', component: ProductoForm, title: 'Editar producto', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' } }
];
