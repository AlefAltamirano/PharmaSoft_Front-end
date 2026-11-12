const { chromium, request, expect } = require('@playwright/test');
const fs = require('node:fs'),
  path = require('node:path');
const api = process.env.S14_API_URL || 'http://localhost:8090/api/v1',
  base = process.env.S14_BASE_URL || 'http://localhost:8081';
const out = path.resolve('evidence/s14/demo');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const http = await request.newContext();
  let r = await http.post(api + '/auth/login', {
    data: { username: 'admin', password: process.env.S14_ADMIN_PASSWORD },
  });
  expect(r.status()).toBe(200);
  const headers = { Authorization: 'Bearer ' + (await r.json()).token };
  async function get(p) {
    const r = await http.get(api + p, { headers });
    expect(r.status()).toBe(200);
    return r.json();
  }
  const categoria = (await get('/categorias')).find((c) => c.estado),
    resultados = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true, slowMo: 180 });
  for (let ensayo = 1; ensayo <= 2; ensayo++) {
    const marca = Date.now(),
      dni = String(marca % 100000000).padStart(8, '0');
    r = await http.post(api + '/clientes', {
      headers,
      data: {
        dni,
        nombres: 'Demo Semana',
        apellidos: 'Catorce ' + ensayo,
        email: `demo-s14-${marca}@example.invalid`,
        telefono: '999999999',
        estado: true,
      },
    });
    expect(r.status()).toBe(201);
    const cliente = await r.json();
    r = await http.post(api + '/productos', {
      headers,
      data: {
        nombre: `DEMO-S14-${marca}`,
        descripcion: 'Producto de demostración',
        precio: 11.5,
        stock: 100,
        estado: true,
        categoriaId: categoria.id,
      },
    });
    expect(r.status()).toBe(201);
    const producto = await r.json();
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: out, size: { width: 1280, height: 800 } },
    });
    await ctx.addInitScript(() => {
      window.print = () => {};
    });
    const page = await ctx.newPage(),
      inicio = Date.now(),
      pasos = [],
      errores = [];
    let venta;
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 500) errores.push(String(r.status()));
    });
    async function paso(nombre, fn) {
      const t = Date.now();
      await fn();
      await page.evaluate((texto) => {
        let d = document.getElementById('demo-subtitulo');
        if (!d) {
          d = document.createElement('div');
          d.id = 'demo-subtitulo';
          Object.assign(d.style, {
            position: 'fixed',
            bottom: '8px',
            left: '260px',
            right: '15px',
            background: '#112b50',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            zIndex: '9999',
            font: '16px sans-serif',
            pointerEvents: 'none',
          });
          document.body.append(d);
        }
        d.textContent = texto;
      }, nombre);
      await new Promise((r) => setTimeout(r, 1800));
      await page.screenshot({
        path: path.join(out, `ensayo-${ensayo}-${String(pasos.length + 1).padStart(2, '0')}.png`),
        fullPage: true,
      });
      pasos.push({ nombre, segundos: +((Date.now() - t) / 1000).toFixed(2) });
    }
    async function login(user, pw) {
      await page.goto(base + '/login');
      await page.getByLabel('Usuario', { exact: true }).fill(user);
      await page.getByLabel('Contraseña', { exact: true }).fill(pw);
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
      await expect(page).not.toHaveURL(/login/);
    }
    await paso('1. Contexto: aplicación integrada y sesión de vendedor', async () => {
      await login('vendedor', process.env.S14_VENDEDOR_PASSWORD);
      await page.goto(base + '/productos?pagina=0&tamanio=20');
      await expect(page.getByTestId('tabla-productos').locator('tbody tr')).toHaveCount(20);
    });
    await paso(
      '2. Volumen: veinte filas por página; URL y recarga conservan la página',
      async () => {
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
        await page.reload();
        await expect(page.getByTestId('pagina-actual')).toContainText('Página 2');
      },
    );
    await paso('3. Cliente recién creado y búsqueda de productos activos', async () => {
      await page.goto(base + '/ventas/nueva');
      await page.getByTestId('buscar-cliente').fill(dni);
      await page.getByTestId('opcion-cliente').filter({ hasText: dni }).click();
      await page.getByTestId('buscar-producto').fill(producto.nombre);
      await page.getByTestId('opcion-producto').filter({ hasText: producto.nombre }).click();
      await page.getByTestId('cantidad').fill('2');
      await expect(page.getByTestId('total-venta')).toContainText('23.00');
    });
    await paso('4. Venta confirmada: dos unidades, importe calculado por el servidor', async () => {
      await page.getByRole('button', { name: 'Continuar a confirmación' }).click();
      let respuesta = page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
      const r = await respuesta;
      expect(r.status()).toBe(201);
      venta = await r.json();
      await expect(page).toHaveURL(new RegExp('/ventas/' + venta.id));
    });
    await paso('5. Stock actualizado sin F5: de cien a noventa y ocho', async () => {
      await page
        .getByRole('link', { name: /Productos/ })
        .first()
        .click();
      await page.getByRole('button', { name: 'ID ↕', exact: true }).click();
      await page.getByRole('button', { name: 'ID ↕', exact: true }).click();
      await expect(
        page
          .getByTestId('tabla-productos')
          .locator('tbody tr')
          .filter({ hasText: producto.nombre }),
      ).toBeVisible();
      expect((await get('/productos/' + producto.id)).stock).toBe(98);
    });
    await paso('6. Seguridad: el vendedor no puede consultar la auditoría', async () => {
      await page.goto(base + '/auditoria');
      await expect(page).toHaveURL(/acceso-denegado/);
    });
    await paso('7. Administrador: reporte de ventas y productos de la venta', async () => {
      await page.getByRole('button', { name: 'Cerrar sesión' }).click();
      await login('admin', process.env.S14_ADMIN_PASSWORD);
      await page.goto(base + '/reportes/ventas-por-categoria');
      await expect(page.getByRole('heading', { name: /Ventas por categoría/i })).toBeVisible();
    });
    await paso('8. Auditoría: usuario, acción, entidad y código de seguimiento', async () => {
      await page.goto(base + '/auditoria?accion=VENTA_REGISTRADA');
      await expect(
        page
          .getByTestId('tabla-auditoria')
          .locator('tbody tr')
          .filter({ hasText: String(venta.id) }),
      ).toBeVisible();
    });
    const auditoria = await get('/auditoria?accion=VENTA_REGISTRADA&tamanio=100'),
      evento = auditoria.contenido.find((e) => e.entidadId === venta.id);
    expect(evento).toBeTruthy();
    expect(errores).toEqual([]);
    const video = page.video();
    await ctx.close();
    await video.saveAs(path.join(out, `demostracion-ensayo-${ensayo}.webm`));
    resultados.push({
      ensayo,
      segundos: +((Date.now() - inicio) / 1000).toFixed(2),
      modalidad: 'Recorrido real automatizado; sin narración oral',
      pasos,
      ventaId: venta.id,
      productoId: producto.id,
      creadoPor: venta.creadoPor,
      evento,
      errores,
    });
    const anular = await http.put(api + `/ventas/${venta.id}/anular`, { headers });
    expect(anular.status()).toBe(200);
    await http.delete(api + `/productos/${producto.id}`, { headers });
  }
  await browser.close();
  await http.dispose();
  fs.writeFileSync(path.join(out, 'ensayos.json'), JSON.stringify(resultados, null, 2));
  console.log(
    JSON.stringify(
      resultados.map(({ ensayo, segundos, errores }) => ({ ensayo, segundos, errores })),
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
