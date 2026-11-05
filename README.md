# PharmaFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# Base previa a la sesión 13

La rama `codex/correcciones-base-s13-altamirano` parte de
`feature/seguridad-frontend-altamirano` y conserva los cambios locales de perfil y
autenticación que estaban pendientes.

Se corrigieron la ordenación de productos antes de paginar, el orden de ventas
por fecha descendente, el límite de 100 caracteres del nombre de producto y el
permiso para anular ventas. El formulario de ventas actualiza el cliente de la
confirmación, exige cantidades enteras y evita envíos repetidos mientras guarda.
Mi cuenta informa el tiempo de espera agotado y finaliza el estado de carga.

Verificación: `npm run build` y `npm test -- --watch=false`.

La rama de la sesión 13 implementa API relativa, reporte diferido y Nginx; Redis se configura en el backend. Productos y ventas siguen utilizando paginación local compatible con el
backend actual. No se fusionaron ramas históricas automáticamente.

## Sesión 13 implementada

Rama: feature/optimizacion-produccion-altamirano. PR: https://github.com/AlefAltamirano/PharmaSoft_Front-end/pull/1

Compilar con npm run build y ejecutar docker compose -f deploy/docker-compose.yml up -d. Abrir http://localhost:8081 con el backend prod en 8080 y Redis en 6379. Reporte diferido solo para REPORTES_VER; JS/CSS con cache de un año y index.html revalidable. Verificado: 16 pruebas, build correcto y 14 comprobaciones locales coordinadas con backend.
