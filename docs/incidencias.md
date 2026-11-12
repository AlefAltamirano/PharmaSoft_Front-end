# Registro de incidencias — 12/11/2026

Se registran problemas observados al revisar la base de Semana 13 y durante la integración de Semana 14. Cada cierre identifica una regresión concreta. P1=alta, P2=media, P3=baja. Los avisos de dependencias se detallan aparte y no se ocultan como incidencias funcionales.

## S14-01 — Listado de ventas filtrado en el navegador — P1 — Cerrada
Módulo: ventas. Reproducir: abrir ventas y aplicar filtros con volumen. Esperado: una página desde Oracle. Observado: servicio descargaba el listado completo y filtraba/recortaba localmente. Causa: endpoint antiguo y filtrado frontend. Corrección: GET /ventas/buscar con filtros, Pageable y validación; frontend consume PaginaResponse. Commits backend e0a5737 / frontend f3638c5. Regresión: E2E 11, medición primera/última página con 20.000 ventas sintéticas.

## S14-02 — Formulario solicitaba hasta mil productos — P2 — Cerrada
Módulo: ventas/catálogo. Reproducir: abrir nueva venta. Esperado: búsquedas acotadas con stock y precio actuales. Observado: carga masiva inicial que se truncaba al crecer el catálogo y superaba el nuevo límite. Causa: búsqueda local sobre la carga de productos. Corrección: endpoints buscar de productos/clientes, activos y stock positivo, máximo veinte coincidencias; debounce 300 ms y switchMap. Commits e0a5737 / f3638c5. Regresión: E2E 07, 10 y 18; prueba de formulario Angular.

## S14-03 — El estado de listas se perdía al recargar — P2 — Cerrada
Módulo: paginación. Reproducir: ir a otra página, filtrar y pulsar F5. Esperado: conservar estado y volver a primera página cuando cambia un filtro. Observado: página y filtros solo existían en memoria. Causa: señales locales sin sincronización con router. Corrección: query params e inputs; paginador compartido de Productos, Ventas y Auditoría. Commit f3638c5 y 03104c6. Regresión: E2E 06, 11 y 12.

## S14-04 — Flyway no se activaba en Boot 4 — P1 — Cerrada
Módulo: persistencia. Reproducir: iniciar la configuración previa e inspeccionar user_tables. Esperado: migraciones administradas. Observado: no existía tabla de historial. Causa: flyway-core sin módulo de autoconfiguración de Boot 4; archivos históricos con nombres incompatibles. Corrección: starter compatible, respaldo previo, baseline explícito del esquema existente y V5 válida. Commit 688a457. Regresión: arranque real con Successfully applied y consulta del historial baseline 4 / V5 exitosa.

## S14-05 — Escrituras sin identidad ni historial de operación — P1 — Cerrada
Módulo: auditoría. Reproducir: registrar venta/cambiar precio en la versión previa. Esperado: usuario y evento correlacionados. Observado: no había campos de usuario ni tabla de eventos. Causa: auditoría aún no implementada. Corrección: entidades auditadas, eventos AFTER_COMMIT, escritor independiente, bitácora append-only y acceso administrativo. Commit 688a457. Regresión: E2E 07, 08, 13 y 16; AuditoriaEventosTest; consulta Oracle.

## S14-06 — Orden inválido al abrir URL con paginación — P2 — Cerrada
Módulo: productos/router. Reproducir: abrir /productos?pagina=0&tamanio=20. Esperado: veinte productos ordenados por nombre. Observado en la primera ronda: 409 y tabla vacía. Causa: withComponentInputBinding entrega undefined para parámetros ausentes, reemplazando los valores iniciales de orden/dirección. Corrección: transforms con fallback explícito. Commit 03104c6. Regresión: E2E 06 y tres repeticiones completas posteriores sin reintentos.

## S14-07 — Precio seleccionado conservaba un valor anterior — P2 — Cerrada
Módulo: venta. Reproducir: seleccionar producto y volver a buscar tras una actualización. Esperado: usar la nueva coincidencia del servidor. Observado en revisión: el merge conservaba prioritariamente el objeto seleccionado anterior. Causa: deduplicación a favor del objeto viejo. Corrección: preservar seleccionados solo si no vienen en la respuesta nueva. Commit 03104c6. Regresión: E2E 18 consulta precio vigente; el precio final siempre lo calcula Oracle/backend.

## Resumen funcional
Siete incidencias: tres P1, cuatro P2; todas cerradas. Ventas/catálogo 3, paginación/router 2, persistencia 1, auditoría 1. No hay P1 funcionales abiertas al cierre de las pruebas registradas. Las limitaciones operativas (outbox, esquema vacío y ensayo oral) figuran en la documentación, no como verificaciones realizadas.
