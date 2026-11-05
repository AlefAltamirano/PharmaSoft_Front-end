import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
import { CategoriaForm } from './pages/categoria-form/categoria-form';
import { CategoriaList } from './pages/categoria-list/categoria-list';

export const CATEGORIAS_ROUTES: Routes = [
  { path: '', component: CategoriaList, title: 'Categorías', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_LEER' } },
  { path: 'nuevo', component: CategoriaForm, title: 'Nueva categoría', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' } },
  { path: ':id/editar', component: CategoriaForm, title: 'Editar categoría', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' } }
];
