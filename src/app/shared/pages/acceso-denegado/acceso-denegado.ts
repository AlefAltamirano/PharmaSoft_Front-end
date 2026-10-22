import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  template: `<main class="page"><h1>Acceso denegado</h1><p>No tienes permisos para consultar este módulo.</p><a routerLink="/inicio">Volver al inicio</a></main>`
})
export class AccesoDenegado {}
