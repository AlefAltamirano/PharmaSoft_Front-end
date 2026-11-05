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

La URL de producción, Redis, el reporte diferido y Nginx se dejan para la sesión
13. Productos y ventas siguen utilizando paginación local compatible con el
backend actual. No se fusionaron ramas históricas automáticamente.
