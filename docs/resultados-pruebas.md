# Resultados de comprobación — 12/11/2026

Estado del código al recoger resultados: Backend afe5cd9; frontend 2b16888. Las posteriores modificaciones documentales se identifican mediante el tag final v1.0-demo.

## Pruebas
- Backend: 55 pruebas, 0 fallos, 0 errores, 0 omitidas. Suite Maven real con conexión a Oracle local.
- Frontend: 18 pruebas unitarias, 16 archivos, todas correctas.
- E2E: 18 escenarios, tres repeticiones, 54 correctas, 0 inesperadas, 0 intermitentes, 0 omitidas. Duración total 72.84 segundos. Workers=1; retries=0.
- Navegador: Edge instalado, motor Chromium. URL frontend localhost:8081, backend localhost:8090. Oracle y Redis locales activos.
- HTML: carpeta Pruebas/playwright-report/index.html del entregable. Datos fuente seguros en evidencias/s14-estabilizacion.
- Sesión vencida: E2E 17 adelanta el reloj del navegador; comprueba retorno de ruta. El token manipulado se rechaza realmente en backend (401); no se presenta el reloj simulado como espera física de una hora.

## Matriz de integración
- I01 cliente nuevo disponible en ventas: E2E 10 y preparación de E2E 07.
- I02 productos activos, stock positivo y precio actual: E2E 18; selección de producto en E2E 07.
- I03 venta de dos unidades reduce stock y se refleja al navegar sin F5: E2E 07 y capturas/recorridos de demostración.
- I04 aumenta el reporte: E2E 07 compara respuesta anterior/posterior; el ensayo muestra el reporte como administrador.
- I05 venta registra usuario y requestId: E2E 07 correlaciona cabecera y evento; trazabilidad-venta.json y consulta Oracle/log.
- I06 cambio de precio registra valores y modificadoPor: E2E 16, cambio-precio.json.
- I07 expiración durante formulario dirige a login y recupera ruta: E2E 17, reloj controlado.
- I08 filtrar ventas desde página cinco vuelve a uno: E2E 11.

## Volumen y límites
Carga marcada: 5.000 productos y 20.000 ventas sintéticas ANULADAS. Los totales reales también incluyen datos previos y fixtures de pruebas. Mediciones de primera/última página, bytes, latencias y requestId: mediciones.json. Tamaño 500 y orden password responden 409. Son mediciones locales individuales sin prueba de carga concurrente; no constituyen un SLA.

## Alcance
La suite comprueba excepciones de negocio sin 500 y registra errores JS no controlados; no se detectaron en las ejecuciones aprobadas. Los recorridos grabados también comprueban ausencia de 500 y pageerror. El diagnóstico de dependencias y su corrección se registra en dependencias.md. No se simulan ensayos orales, capturas históricas ausentes ni entregas al aula virtual.
