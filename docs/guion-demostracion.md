# Guion de demostración — objetivo 10 minutos

## 00:00–01:00 — Contexto (1 min)
PharmaSoft integra catálogo, clientes, ventas y reportes. Mostrar las ramas y el tag de la entrega. Explicar que Oracle es la fuente de verdad, Redis acelera lecturas y Angular conserva el estado en la URL.

## 01:00–04:30 — Flujo principal (3,5 min)
Ingresar como vendedor. Seleccionar un cliente preparado (o crear uno), buscar producto activo con stock, agregar dos unidades, comprobar total estimado y confirmar. Mostrar comprobante. Navegar a Productos sin F5 y comprobar el stock reducido en dos. Explicar que el backend usa precio actual, transacción y bloqueo de productos; la UI no decide el total definitivo.

## 04:30–06:00 — Seguridad (1,5 min)
Mostrar que el vendedor no puede editar catálogo ni consultar auditoría. La ruta directa también deniega acceso. Almacenero no accede a ventas. Explicar 401 frente a 403 y la recuperación de ruta después de expirar sesión.

## 06:00–07:30 — Volumen (1,5 min)
Mostrar veinte filas, siguiente/última página, URL, F5 y filtros que reinician la página. Citar las mediciones reales y la marca sintética de 5.000 productos/20.000 ventas de carga. No afirmar que la latencia local es un SLA de producción.

## 07:30–08:30 — Auditoría (1 min)
Ingresar como administrador, abrir la bitácora, filtrar VENTA_REGISTRADA. Seguir una venta con creadoPor, entidadId y requestId entre Oracle, respuesta y log. Mencionar los dos eventos adicionales: cliente registrado y venta anulada.

## 08:30–10:00 — Calidad y cierre (1,5 min)
Mostrar reporte Playwright con las repeticiones, pruebas unitarias e incidencias cerradas. Explicar AFTER_COMMIT/REQUIRES_NEW y su limitación de entrega; mostrar enlaces de los repositorios y evidencias. Tener a mano el video de respaldo.

## Ensayos y video
Se entregan dos recorridos reales automatizados cronometrados y un video sin narración oral. Ver evidencias/s14-estabilizacion/ensayos.json y la carpeta Videos del entregable. Estos tiempos miden la operación automatizada; no son dos ensayos orales humanos. Antes de la clase, el estudiante debe practicar dos veces este guion con narración y anotar sus tiempos y desvíos. Esa práctica personal no se declara realizada por el agente.

Tres flujos base para practicar: (1) venta de dos unidades y stock, (2) denegación por rol/ruta, (3) paginación y trazabilidad administrativa. No improvisar cambios de datos reales durante la exposición.
