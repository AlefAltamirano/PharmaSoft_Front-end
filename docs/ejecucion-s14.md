# Ejecución y compatibilidad

Base comprobada: Java 21, Spring Boot 4.0.7, Oracle local FREEPDB1 (host 1522), Redis 6379, Angular 22, TypeScript 6. Se conservó la base funcional de Semana 13. Los procesos de la versión anterior no se cerraron para hacer las pruebas: Semana 14 usa backend 8090 y frontend build 8081.

## Entorno local de pruebas
1. Iniciar Oracle y Redis. El respaldo privado de PHARMADB está fuera del repositorio en Escritorio/Semana 14/Respaldo_privado; contiene información sensible y no debe subirse a GitHub.
2. Backend: Java 21; ejecutar mvnw.cmd package en un equipo con Maven Wrapper configurado, luego java -jar target/PharmaBackckend-0.0.1-SNAPSHOT.jar --server.port=8090. En esta máquina se usó el Maven 3.9.16 ya almacenado porque el wrapper intenta descargar herramientas. No exportar secretos a los informes.
3. Frontend: npm ci, npm run build, node scripts/preview-s14.cjs. Abre http://localhost:8081; el proxy local envía /api al 8090. API_URL y PORT son configurables. Este script es una vista local, no el servidor de producción. Para Angular serve se mantiene el entorno development habitual contra 8080.
4. npm test -- --watch=false. Para E2E, instalar componentes con npx playwright install ffmpeg. La configuración local usa Edge (motor Chromium) instalado. Para Chromium descargado, instalar chromium y definir S14_BROWSER_CHANNEL=chromium.
5. Definir S14_ADMIN_PASSWORD, S14_VENDEDOR_PASSWORD y S14_ALMACEN_PASSWORD en el proceso local, luego npx playwright test --repeat-each=3. No guardar esas variables en Git. S14_BASE_URL y S14_API_URL permiten cambiar destinos.

Las pruebas crean clientes/productos sintéticos con prefijos E2E-S14 y anulan las ventas de prueba para restituir stock. Los productos se dan de baja lógica al final. No borran la bitácora. Los clientes se conservan por integridad de las ventas históricas de prueba.

## Carga y retirada de volumen
Con Oracle respaldado: scripts/s14-oracle.ps1 scripts/sql/s14-volumen.sql. Es idempotente por nombres de producto y cantidad marcada creado_por=carga. Añade 5.000 productos y 20.000 ventas ANULADAS sin detalles, fechadas en 2025: sirven para paginar, no simulan ventas comerciales ni modifican reportes de ventas registradas. No es una migración ni se ejecuta al iniciar la aplicación.

Para retirar solo esa carga: scripts/s14-oracle.ps1 scripts/sql/s14-limpiar-volumen.sql. Conserva filas que estén referenciadas por detalles. Tras SQL directo, invalidar únicamente las cachés productos/categorias o reiniciar con su TTL vencido; no usar FLUSHALL en un Redis compartido. Las creaciones API de fixtures invalidaron productos antes de las mediciones registradas.

## Límites conocidos
El esquema base del proyecto debe existir antes del baseline. La entrega no instala una base completamente vacía. No se garantizan métricas de producción ni concurrencia por una medición local individual. La pérdida de auditoría tras un fallo entre commit y escritura se registra pero requiere outbox para garantía de entrega. Los PR se dejan abiertos para revisión; no se mezclaron automáticamente con develop.
