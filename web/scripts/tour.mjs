import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";
import { join } from "node:path";

function chromePath() {
  const base = "/opt/pw-browsers";
  const d = readdirSync(base).find((x) => /^chromium-\d+$/.test(x));
  return d ? join(base, d, "chrome-linux", "chrome") : undefined;
}
const BASE = "http://127.0.0.1:3000";
const OUT = process.argv[2];
const email = `tour${Date.now()}@test.com`;
const log = (...a) => console.log("•", ...a);
const b = await chromium.launch({ headless: true, executablePath: chromePath() });

async function waitUrl(page, re, t = 30000) {
  await page.waitForFunction((rs) => new RegExp(rs).test(location.href), re.source, { timeout: t });
}
async function shot(page, name, full = false) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  log("shot", name);
}

// Foto de producto (generada) para que la ficha/flyer se vean reales
const pp = await b.newPage({ viewport: { width: 1000, height: 700 } });
await pp.setContent(
  `<div style="width:1000px;height:700px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f6d365,#fda085);font-family:system-ui;font-weight:800;font-size:110px;color:#7a3b00">🥐 Panadería</div>`,
);
const photo = await (await pp.$("div")).screenshot();
await pp.close();

const ctx = await b.newContext({ viewport: { width: 1240, height: 900 } });
const page = await ctx.newPage();

try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot(page, "01-landing", true);

  await page.goto(`${BASE}/valuar`, { waitUntil: "networkidle" });
  await page.selectOption('[name="familia"]', "gastronomia");
  await page.selectOption('[name="enMarcha"]', "si");
  await page.fill('[name="antiguedad"]', "8");
  await page.selectOption('[name="datosMano"]', "si");
  await shot(page, "02-elegibilidad");

  await page.getByRole("button", { name: /Continuar/ }).click();
  await waitUrl(page, /\/registro/);
  await page.fill('[name="nombre"]', "Juan Panadero");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', "secret123");
  await shot(page, "03-registro");
  await page.getByRole("button", { name: /Crear cuenta/ }).click();
  await waitUrl(page, /\/valuar\/[0-9a-f]{8}-/);
  const id = page.url().split("/valuar/")[1].split(/[/?]/)[0];

  // Wizard
  await page.waitForSelector('[name="actividadDesc"]');
  await page.fill('[name="actividadDesc"]', "Panadería y cafetería de barrio con venta al público y delivery. Clientela fija de más de 8 años.");
  await page.selectOption('[name="provincia"]', "Córdoba");
  await page.fill('[name="localidad"]', "Villa Carlos Paz");
  await page.fill('[name="anioInicio"]', "2018");
  await page.fill('[name="empleados"]', "8");
  await page.fill('[name="duenosTrabajan"]', "2");
  await page.selectOption('[name="local"]', "alquilado");
  await shot(page, "04-wizard-identidad");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="monedaCarga"]');
  await page.selectOption('[name="monedaCarga"]', "ARS");
  await page.selectOption('[name="ventasCargaModo"]', "anual");
  await page.fill('[name="ventasAnual"]', "240000000");
  await page.selectOption('[name="anioRepresentativo"]', "normal");
  await shot(page, "05-wizard-ventas", true);
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="cogsModo"]');
  await page.selectOption('[name="cogsModo"]', "pct");
  await page.fill('[name="cogsPct"]', "38");
  await page.fill('[name="gAlquiler"]', "1200000");
  await page.fill('[name="gSueldos"]', "3000000");
  await page.fill('[name="gOtros"]', "1000000");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="retiroDuenos"]');
  await page.fill('[name="retiroDuenos"]', "2000000");
  await page.fill('[name="sueldoMercadoDueno"]', "1500000");
  await page.fill('[name="gastosPersonales"]', "3000000");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="inventario"]');
  await page.fill('[name="inventario"]', "8000000");
  await page.fill('[name="equipamiento"]', "40000000");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="deudaTransfiere"]');
  await page.selectOption('[name="deudaTransfiere"]', "quedan");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.waitForSelector('[name="tendencia"]');
  await page.selectOption('[name="tendencia"]', "crece");
  await page.selectOption('[name="dependenciaDueno"]', "media");
  await page.selectOption('[name="motivoVenta"]', "Retiro");
  await page.getByRole("button", { name: /Calcular mi valuación/ }).click();
  await waitUrl(page, /\/resultado/);
  await shot(page, "06-teaser", true);

  await page.getByRole("link", { name: /Desbloquear/ }).click();
  await waitUrl(page, /\/pago/);
  await shot(page, "07-pago");
  await page.getByRole("button", { name: /Pagar/ }).click();
  await waitUrl(page, /\/completo/);
  await shot(page, "08-resultado", true);

  await page.goto(`${BASE}/valuar/${id}/informe`, { waitUntil: "networkidle" });
  await shot(page, "09-informe", true);

  await page.goto(`${BASE}/valuar/${id}/completo`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Publicar en el Marketplace/ }).click();
  await page.waitForSelector("text=Armá tu publicación");
  await page.fill('input[placeholder="Tu nombre"]', "Juan Panadero");
  await page.fill('input[placeholder^="WhatsApp"]', "+54 9 351 1234567");
  await page.fill('input[placeholder="Email"]', "juan@panaderia.com");
  await page.setInputFiles('input[type=file]', { name: "panaderia.png", mimeType: "image/png", buffer: photo });
  await page.waitForSelector('img[src^="/api/media/"]');
  await shot(page, "10-publicar", true);
  await page.getByRole("button", { name: /Ver vista previa/ }).click();
  await waitUrl(page, /\/publicacion/);
  await page.getByRole("button", { name: /Enviar a revisión/ }).click();
  await page.getByText(/en revisión/i).waitFor();

  // Admin
  const actx = await b.newContext({ viewport: { width: 1240, height: 900 } });
  const admin = await actx.newPage();
  await admin.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await admin.fill('[name="email"]', "admin@nexonegocios.local");
  await admin.fill('[name="password"]', "admin1234");
  await admin.getByRole("button", { name: /Ingresar/ }).click();
  await admin.waitForTimeout(2500);
  await admin.goto(`${BASE}/admin/moderacion`, { waitUntil: "networkidle" });
  await shot(admin, "11-admin-moderacion", true);
  for (let k = 0; k < 8; k++) {
    await admin.goto(`${BASE}/admin/moderacion`, { waitUntil: "networkidle" });
    const btns = admin.getByRole("button", { name: /Aprobar y publicar/ });
    if ((await btns.count()) === 0) break;
    await admin.locator('input[name="cuit"]').first().check();
    await admin.locator('input[name="google"]').first().check();
    await btns.first().click();
    await admin.waitForTimeout(1500);
  }
  await actx.close();

  // Ficha pública + contacto
  await page.goto(`${BASE}/valuar/${id}/publicacion`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Ver mi publicación online/ }).click();
  await waitUrl(page, /\/empresa\//);
  await shot(page, "12-ficha", true);
  await page.fill('input[placeholder="Tu nombre *"]', "María Compradora");
  await page.fill('input[placeholder="Email"]', "maria@test.com");
  await page.fill('textarea[placeholder="Tu consulta"]', "Hola, me interesa mucho. ¿Podemos coordinar una visita?");
  await page.getByRole("button", { name: /Enviar consulta y ver contacto/ }).click();
  await page.getByText(/Contactá al vendedor/).waitFor();
  await shot(page, "13-contacto");

  await page.goto(`${BASE}/marketplace`, { waitUntil: "networkidle" });
  await shot(page, "14-marketplace", true);

  await page.goto(`${BASE}/panel`, { waitUntil: "networkidle" });
  await shot(page, "15-panel", true);
  await page.goto(`${BASE}/panel/${id}`, { waitUntil: "networkidle" });
  await shot(page, "16-panel-leads", true);

  console.log("\n✅ TOUR OK");
} catch (e) {
  console.error("❌ TOUR FALLÓ:", e.message);
  process.exitCode = 1;
} finally {
  await b.close();
}
