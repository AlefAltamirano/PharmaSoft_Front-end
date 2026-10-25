import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
import { VentasPorCategoria } from './pages/ventas-por-categoria/ventas-por-categoria';

export const REPORTES_ROUTES: Routes = [
  {
    path: 'ventas-por-categoria',
    component: VentasPorCategoria,
    title: 'Ventas por categoría',
    canActivate: [permisoGuard],
    data: { permiso: 'REPORTES_VER' }
  }
];

