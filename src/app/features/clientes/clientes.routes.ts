import { Routes } from '@angular/router';
import { ClienteList } from './pages/cliente-list/cliente-list';
import { ClienteForm } from './pages/cliente-form/cliente-form';
import { permisoGuard } from '../../core/guards/permiso-guard';

export const CLIENTES_ROUTES: Routes = [
  { path: '', component: ClienteList, title: 'Clientes', canActivate: [permisoGuard], data: { permiso: 'CLIENTES_LEER' } },
  { path: 'nuevo', component: ClienteForm, title: 'Nuevo cliente', canActivate: [permisoGuard], data: { permiso: 'CLIENTES_ESCRIBIR' } },
  { path: ':id/editar', component: ClienteForm, title: 'Editar cliente', canActivate: [permisoGuard], data: { permiso: 'CLIENTES_ESCRIBIR' } }
];