import { test, expect, Page, APIRequestContext } from '@playwright/test';
const api = process.env.S14_API_URL || 'http://localhost:8090/api/v1';
const passwords: Record<string, string | undefined> = {
  admin: process.env.S14_ADMIN_PASSWORD,
  vendedor: process.env.S14_VENDEDOR_PASSWORD,
  almacen: process.env.S14_ALMACEN_PASSWORD,
};
let adminHeaders: Record<string, string>, cliente: any, producto: any;
const ventas: number[] = [];
async function loginApi(request: APIRequestContext, username = 'admin') {
  const password = passwords[username];
  if (!password) throw new Error(`Falta S14_${username.toUpperCase()}_PASSWORD`);
  const r = await request.post(`${api}/auth/login`, { data: { username, password } });
  expect(r.status()).toBe(200);
  return { Authorization: `Bearer ${(await r.json()).token}` };
}
async function login(page: Page, username = 'admin') {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill(passwords[username]!);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function datos(request: APIRequestContext, path: string, headers = adminHeaders) {
  const r = await request.get(`${api}${path}`, { headers });
  expect(r.status()).toBe(200);
  return r.json();
}
test.beforeAll(async ({ request }) => {
  adminHeaders = await loginApi(request);
  const categorias = await datos(request, '/categorias');
  const categoria = categorias.find((c: any) => c.estado);
  const n = Date.now();
  const dni = String(n % 100000000).padStart(8, '0');
  let r = await request.post(`${api}/clientes`, {
    headers: adminHeaders,
    data: {
      dni,
      nombres: `Prueba${n}`,
      apellidos: 'Semana Catorce',
      email: `s14-${n}@example.invalid`,
      telefono: '999999999',
      direccion: 'Datos sintéticos E2E',
      estado: true,
    },
  });
  expect(r.status()).toBe(201);
  cliente = await r.json();
  r = await request.post(`${api}/productos`, {
    headers: adminHeaders,
    data: {
      nombre: `E2E-S14-${n}`,
      descripcion: 'Fixture automatizado',
      precio: 11.5,
      stock: 100,
      estado: true,
      categoriaId: categoria.id,
    },
  });
  expect(r.status()).toBe(201);
  producto = await r.json();
});
test.afterAll(async ({ request }) => {
  for (const id of ventas) {
    const r = await request.put(`${api}/ventas/${id}/anular`, { headers: adminHeaders });
    expect(r.ok()).toBeTruthy();
  }
  if (producto) await request.delete(`${api}/productos/${producto.id}`, { headers: adminHeaders });
});
test.beforeEach(async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 500) errores.push(`${r.status()} ${r.url()}`);
  });
  (page as any).erroresS14 = errores;
});
test.afterEach(async ({ page }) => {
  expect((page as any).erroresS14).toEqual([]);
});

test('01 ruta protegida dirige a login', async ({ page }) => {
  await page.goto('/ventas/nueva');
  await expect(page).toHaveURL(/\/login.*returnUrl/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
test('02 credenciales inválidas muestran error y seguimiento', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill('admin');
  await page.getByLabel('Contraseña', { exact: true }).fill('ClaveIncorrecta-S14');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/seguimiento|solicitud|credenciales/i);
  await expect(page).toHaveURL(/\/login/);
});
test('03 login regresa a la ruta solicitada', async ({ page }) => {
  await page.goto('/ventas/nueva');
  await page.getByLabel('Usuario', { exact: true }).fill('vendedor');
  await page.getByLabel('Contraseña', { exact: true }).fill(passwords.vendedor!);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/ventas\/nueva/);
});
test('04 almacén no ve ni abre ventas', async ({ page }) => {
  await login(page, 'almacen');
  await expect(
    page.locator('app-sidebar').getByRole('link', { name: 'Ventas', exact: false }),
  ).toHaveCount(0);
  await page.goto('/ventas');
  await expect(page).toHaveURL(/acceso-denegado/);
});
test('05 vendedor consulta productos sin controles de edición', async ({ page }) => {
  await login(page, 'vendedor');
  await page.goto('/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();
  await expect(page.getByRole('link', { name: /Nuevo producto/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Editar', exact: true })).toHaveCount(0);
});
test('06 productos paginados conservan URL F5 y atrás', async ({ page }) => {
  await login(page);
  await page.goto('/productos?pagina=0&tamanio=20');
  await expect(page.getByTestId('tabla-productos').locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page).toHaveURL(/pagina=1/);
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 2');
  await page.reload();
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 2');
  await page.goBack();
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 1');
});
test('07 venta de dos unidades actualiza stock reporte y auditoría', async ({
  page,
  request,
}, info) => {
  await login(page, 'vendedor');
  const antes = await datos(request, `/productos/${producto.id}`);
  const reporteAntes = await datos(request, '/reportes/ventas-por-categoria');
  await page.goto('/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(cliente.dni);
  await page.getByTestId('opcion-cliente').filter({ hasText: cliente.dni }).click();
  await page.getByTestId('buscar-producto').fill(producto.nombre);
  await page.getByTestId('opcion-producto').filter({ hasText: producto.nombre }).click();
  await page.getByTestId('cantidad').fill('2');
  await expect(page.getByTestId('total-venta')).toContainText('23.00');
  await page.getByRole('button', { name: 'Continuar a confirmación' }).click();
  const respuesta = page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const response = await respuesta;
  expect(response.status()).toBe(201);
  const venta = await response.json();
  ventas.push(venta.id);
  await expect(page).toHaveURL(new RegExp(`/ventas/${venta.id}`));
  const despues = await datos(request, `/productos/${producto.id}`);
  expect(despues.stock).toBe(antes.stock - 2);
  const reporteDespues = await datos(request, '/reportes/ventas-por-categoria');
  const sumarImportes = (filas: any[]) =>
    filas.reduce((suma, fila) => suma + Number(fila.montoTotal), 0);
  const sumarUnidades = (filas: any[]) =>
    filas.reduce((suma, fila) => suma + Number(fila.cantidadVendida), 0);
  expect(sumarImportes(reporteDespues)).toBeCloseTo(sumarImportes(reporteAntes) + 23, 2);
  expect(sumarUnidades(reporteDespues)).toBe(sumarUnidades(reporteAntes) + 2);
  const bitacora = await datos(request, '/auditoria?accion=VENTA_REGISTRADA&tamanio=100');
  const evento = bitacora.contenido.find((e: any) => e.entidadId === venta.id);
  expect(evento).toBeTruthy();
  expect(evento.requestId).toBe(response.headers()['x-request-id']);
  expect(venta.creadoPor.toLowerCase()).toBe('vendedor');
  await page
    .getByRole('link', { name: /Productos/ })
    .first()
    .click();
  await expect(page.getByTestId('tabla-productos')).toBeVisible();
  await page.getByRole('button', { name: 'ID ↕', exact: true }).click();
  await page.getByRole('button', { name: 'ID ↕', exact: true }).click();
  await expect(
    page
      .getByTestId('tabla-productos')
      .locator('tbody tr')
      .filter({ hasText: producto.nombre })
      .locator('td')
      .nth(4),
  ).toHaveText(String(antes.stock - 2));
  await info.attach('trazabilidad-venta', {
    body: JSON.stringify(
      {
        ventaId: venta.id,
        stockAntes: antes.stock,
        stockDespues: despues.stock,
        creadoPor: venta.creadoPor,
        evento,
        reportes: { antes: reporteAntes, despues: reporteDespues },
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
});
test('08 stock insuficiente responde 409 sin venta ni evento', async ({ request }) => {
  const antes = await datos(request, `/productos/${producto.id}`);
  const ventasAntes = (await datos(request, '/ventas/buscar')).totalElementos;
  const eventosAntes = (await datos(request, '/auditoria?accion=VENTA_REGISTRADA')).totalElementos;
  const r = await request.post(`${api}/ventas`, {
    headers: adminHeaders,
    data: {
      clienteId: cliente.id,
      detalles: [{ productoId: producto.id, cantidad: antes.stock + 1 }],
    },
  });
  expect(r.status()).toBe(409);
  expect((await datos(request, `/productos/${producto.id}`)).stock).toBe(antes.stock);
  expect((await datos(request, '/ventas/buscar')).totalElementos).toBe(ventasAntes);
  expect((await datos(request, '/auditoria?accion=VENTA_REGISTRADA')).totalElementos).toBe(
    eventosAntes,
  );
  expect((await r.json()).requestId).toBeTruthy();
});
test('09 venta sin productos responde 400', async ({ request }) => {
  const r = await request.post(`${api}/ventas`, {
    headers: adminHeaders,
    data: { clienteId: cliente.id, detalles: [] },
  });
  expect(r.status()).toBe(400);
});
test('10 cliente recién creado aparece en búsqueda de venta', async ({ page }) => {
  await login(page, 'vendedor');
  await page.goto('/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(cliente.dni);
  await expect(page.getByTestId('opcion-cliente').filter({ hasText: cliente.dni })).toBeVisible();
});
test('11 filtro de ventas vuelve de página cinco a uno', async ({ page }) => {
  await login(page);
  await page.goto('/ventas?pagina=4&tamanio=20');
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 5');
  await page.getByLabel('Desde', { exact: true }).fill('2025-01-01');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 1');
});
test('12 administrador pagina auditoría y conserva filtros', async ({ page }) => {
  await login(page);
  await page.goto('/auditoria');
  await expect(page.getByTestId('tabla-auditoria')).toBeVisible();
  await page.getByLabel('Usuario', { exact: true }).fill('admin');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByLabel('Filas', { exact: true }).selectOption('10');
  await expect(page).toHaveURL(/tamanio=10/);
  await page.reload();
  await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('admin');
  await expect(page.getByTestId('tabla-auditoria').locator('tbody tr').first()).toBeVisible();
});
test('13 vendedor no accede a auditoría UI ni API', async ({ page, request }) => {
  const headers = await loginApi(request, 'vendedor');
  expect((await request.get(`${api}/auditoria`, { headers })).status()).toBe(403);
  await login(page, 'vendedor');
  await expect(page.locator('app-sidebar').getByRole('link', { name: /Auditoría/ })).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page).toHaveURL(/acceso-denegado/);
});
test('14 token manipulado responde 401', async ({ request }) => {
  expect(
    (
      await request.get(`${api}/ventas/buscar`, {
        headers: { Authorization: 'Bearer token.manipulado.s14' },
      })
    ).status(),
  ).toBe(401);
});
test('15 límites y orden inválidos responden 409', async ({ request }) => {
  expect(
    (await request.get(`${api}/productos?tamanio=500`, { headers: adminHeaders })).status(),
  ).toBe(409);
  expect(
    (await request.get(`${api}/productos?ordenarPor=password`, { headers: adminHeaders })).status(),
  ).toBe(409);
});
test('16 precio modificado conserva usuario y valores anterior y nuevo', async ({
  request,
}, info) => {
  const actual = await datos(request, `/productos/${producto.id}`);
  const precio = Number(actual.precio) + 1;
  const r = await request.put(`${api}/productos/${producto.id}`, {
    headers: adminHeaders,
    data: { ...actual, categoriaId: actual.categoria.id, precio },
  });
  expect(r.status()).toBe(200);
  const bitacora = await datos(request, '/auditoria?accion=PRECIO_MODIFICADO&tamanio=100');
  const evento = bitacora.contenido.find((e: any) => e.entidadId === producto.id);
  expect(evento.detalle).toContain(`nuevo=${precio}`);
  const actualizado = await datos(request, `/productos/${producto.id}`);
  expect(actualizado.modificadoPor.toLowerCase()).toBe('admin');
  await info.attach('cambio-precio', {
    body: JSON.stringify({
      productoId: producto.id,
      anterior: actual.precio,
      nuevo: precio,
      modificadoPor: actualizado.modificadoPor,
      evento,
    }),
    contentType: 'application/json',
  });
});
test('17 sesión vence durante formulario y retorna tras login', async ({ page }) => {
  await page.clock.install();
  await login(page, 'vendedor');
  await page.goto('/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(cliente.dni);
  await page.clock.fastForward(3601000);
  await expect(page).toHaveURL(/login.*expirada=1.*returnUrl/);
  await page.getByLabel('Usuario', { exact: true }).fill('vendedor');
  await page.getByLabel('Contraseña', { exact: true }).fill(passwords.vendedor!);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/ventas\/nueva/);
});
test('18 búsqueda ofrece activos con stock y precio vigente', async ({ request }) => {
  const p = await datos(request, `/productos/${producto.id}`);
  const rows = await datos(
    request,
    `/productos/buscar?texto=${encodeURIComponent(producto.nombre)}`,
  );
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((r: any) => r.estado && r.stock > 0)).toBeTruthy();
  expect(rows.find((r: any) => r.id === producto.id).precio).toBe(p.precio);
});
