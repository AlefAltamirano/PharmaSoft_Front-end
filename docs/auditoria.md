# Auditoría: identidad, eventos y trazabilidad

## Dos responsabilidades
Spring Data JPA registra creadoPor y modificadoPor en categorías, productos y clientes; las ventas conservan creadoPor. Se mantienen los callbacks de fechas ya existentes. CreacionAuditada y EntidadAuditada usan AuditingEntityListener; UsuarioAuditor obtiene el usuario autenticado, excluye AnonymousAuthenticationToken y usa sistema para trabajos sin sesión. Los DTO exponen esos campos sin alterar los campos anteriores.

La bitácora guarda un historial separado de acciones. AuditoriaEventos captura usuario y MDC.requestId antes de terminar la operación. La operación de negocio publica un EventoAuditoria dentro de su transacción. TransactionalEventListener(AFTER_COMMIT) llama a un bean separado AuditoriaEscritor con REQUIRES_NEW: un rollback de negocio no genera evento confirmado. Un fallo de escritura se registra en logs y no revierte una venta ya confirmada. Esta política puede perder un evento si Oracle falla justo después del commit; para entrega garantizada se necesitaría un outbox transaccional y reintentos supervisados.

## Eventos implementados
- VENTA_REGISTRADA: Venta, ID y total/líneas; solo tras confirmar la transacción.
- PRECIO_MODIFICADO: Producto, ID, precio anterior y nuevo; solo si cambia.
- PRODUCTO_ELIMINADO: Producto, ID; baja lógica.
- LOGIN_EXITOSO y LOGIN_FALLIDO: Usuario; escritura directa REQUIRES_NEW independiente de la autenticación.
- CLIENTE_REGISTRADO: Cliente, ID; evento adicional de la autónoma.
- VENTA_ANULADA: Venta, ID, restitución de stock; evento adicional de la autónoma.

No se escriben contraseñas, JWT, DNI ni correos en los detalles de eventos. Usuario y requestId permiten correlacionar respuesta HTTP, log y fila de Oracle. El detalle se limita a 500 caracteres y requestId a 36. El registro es append-only: no hay API de edición/borrado y un trigger Oracle rechaza UPDATE/DELETE. El propietario del esquema aún puede administrar o deshabilitar ese trigger; no se presenta como una protección criptográfica.

## Acceso y consultas
GET /api/v1/auditoria exige USUARIOS_ADMINISTRAR tanto en SecurityConfig como en PreAuthorize. El menú y la ruta Angular también exigen ese permiso. La API es la autoridad de seguridad incluso si se manipula la interfaz.

Filtros usuario parcial sin distinguir mayúsculas, acción exacta, desde y hasta inclusivos por día (límite superior exclusivo al día siguiente). Orden fecha descendente e ID estable, página desde cero, tamaño entre 1 y 100. Las búsquedas y cambios de tamaño vuelven a la página cero. La URL conserva filtros y paginación al recargar.

## Esquema existente y migraciones
El esquema real no tenía flyway_schema_history. Los archivos históricos V2_seguridad.sql, V3_actualizar_claves_usuarios.sql y V4_restaurar_supervisor.sql no siguen el separador doble de Flyway y no se ejecutaban. Además, Boot 4 requiere spring-boot-starter-flyway. Se preservaron los históricos, se respaldó PHARMADB mediante Data Pump y se estableció baseline 4 del esquema observado. V5__auditoria.sql fue aplicada realmente y consta en el historial. El baseline reconoce un esquema existente: no certifica que los archivos antiguos fueran ejecutados por Flyway.

Se usa V5 para no reutilizar la numeración histórica V4 mencionada en la guía. La base conserva sus columnas de fechas con nombres entre comillas y espacios. Se añadieron campos de usuario, auditoria_eventos, índices de fecha/usuario-fecha/nombre de producto y el trigger de inmutabilidad. Hibernate validate ya no modifica tablas implícitamente en desarrollo. Una base vacía necesita el esquema base preexistente; esta entrega está validada sobre la base del proyecto, no sobre una instalación vacía.

## Cómo verificar una venta
1. Abrir evidencias/s14-estabilizacion/trazabilidad-venta.json y tomar ventaId y requestId.
2. Consultar SELECT id,creado_por FROM ventas WHERE id=<ventaId>.
3. Consultar SELECT usuario,accion,entidad_id,request_id FROM auditoria_eventos WHERE entidad='Venta' AND entidad_id=<ventaId>.
4. Buscar ese requestId en el log del backend: POST /api/v1/ventas -> 201.
5. Abrir /auditoria con admin y filtrar VENTA_REGISTRADA.

La regresión de stock insuficiente comprueba que un 409 conserva stock, total de ventas y total de eventos VENTA_REGISTRADA. La prueba unitaria comprueba que un fallo del escritor de auditoría no se propaga al negocio confirmado.
