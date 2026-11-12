# Dependencias comprobadas

El diagnóstico inicial de npm informó siete alertas (cinco altas, una moderada y una baja) en herramientas de desarrollo y sus dependencias. Se actualizaron Angular CLI y build a 22.2.7, conservando framework y compiler-cli en la versión 22.2.1 que ya estaba instalada. Las versiones se fijaron y se incorporó package-lock.json para reproducir la instalación.

Se aplicó un override de parche undici 8.12.4 para cerrar la última alerta transitiva. No se usaron --force ni --legacy-peer-deps. La auditoría final de npm del 12/11/2026 informa cero alertas conocidas, incluidas cero altas y críticas. Se verificaron compilación, pruebas unitarias y E2E después del cambio. Es una comprobación del catálogo de avisos de npm en esa fecha, no una certificación de ausencia de vulnerabilidades desconocidas ni una auditoría completa del backend.
