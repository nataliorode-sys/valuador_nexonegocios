import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";
import { join } from "node:path";

function chromePath() {
  const base = "/opt/pw-browsers";
  const dir = readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
  return dir ? join(base, dir, "chrome-linux", "chrome") : undefined;
}

const BASE = "http://127.0.0.1:3000";
const log = (...a) => console.log("•", ...a);
const email = `seller${Date.now()}@test.com`;
const browser = await chromium.launch({ headless: true, executablePath: chromePath() });

// Espera por URL sondeando en el browser (robusto ante navegaciones soft de server actions).
async function waitUrl(page, re, t = 30000) {
  await page.waitForFunction((rs) => new RegExp(rs).test(location.href), re.source, { timeout: t });
}
async function nextStep(page) {
  await page.getByRole("button", { name: /Siguiente/ }).click();
}
async function waitField(page, name) {
  await page.waitForSelector(`[name="${name}"]`, { timeout: 15000 });
}

try {
  // Seguridad: sin sesión /panel → login
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/panel`, { waitUntil: "networkidle" });
  log("Sin sesión, /panel → login:", /\/ingresar/.test(ap.url()));
  await anon.close();

  const ctxS = await browser.newContext();
  const page = await ctxS.newPage();

  // Elegibilidad → registro
  await page.goto(`${BASE}/valuar`, { waitUntil: "networkidle" });
  await page.selectOption('[name="familia"]', "gastronomia");
  await page.selectOption('[name="enMarcha"]', "si");
  await page.fill('[name="antiguedad"]', "6");
  await page.selectOption('[name="datosMano"]', "si");
  await page.getByRole("button", { name: /Continuar/ }).click();
  await waitUrl(page, /\/registro/);
  log("Elegibilidad → registro");

  // Registro → cuenta → valuación
  await page.fill('[name="nombre"]', "Juan Panadero");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', "secret123");
  await page.getByRole("button", { name: /Crear cuenta/ }).click();
  await waitUrl(page, /\/valuar\/[0-9a-f]{8}-/);
  const id = page.url().split("/valuar/")[1].split(/[/?]/)[0];
  log("Cuenta creada + valuación:", id);

  // Wizard
  await waitField(page, "actividadDesc");
  await page.fill('[name="actividadDesc"]', "Panaderia y cafeteria de barrio con venta al publico y delivery");
  await page.selectOption('[name="provincia"]', "Córdoba");
  await page.fill('[name="localidad"]', "Villa Carlos Paz");
  await page.fill('[name="anioInicio"]', "2018");
  await page.fill('[name="empleados"]', "8");
  await page.fill('[name="duenosTrabajan"]', "2");
  await page.selectOption('[name="local"]', "alquilado");
  await nextStep(page); await waitField(page, "monedaCarga");

  await page.selectOption('[name="monedaCarga"]', "ARS");
  await page.selectOption('[name="ventasCargaModo"]', "anual");
  await page.fill('[name="ventasAnual"]', "240000000");
  await page.selectOption('[name="anioRepresentativo"]', "normal");
  await nextStep(page); await waitField(page, "cogsModo");

  await page.selectOption('[name="cogsModo"]', "pct");
  await page.fill('[name="cogsPct"]', "38");
  await page.fill('[name="gAlquiler"]', "1200000");
  await page.fill('[name="gSueldos"]', "3000000");
  await page.fill('[name="gOtros"]', "1000000");
  await nextStep(page); await waitField(page, "retiroDuenos");

  await page.fill('[name="retiroDuenos"]', "2000000");
  await page.fill('[name="sueldoMercadoDueno"]', "1500000");
  await page.fill('[name="gastosPersonales"]', "3000000");
  await nextStep(page); await waitField(page, "inventario");

  await page.fill('[name="inventario"]', "8000000");
  await page.fill('[name="equipamiento"]', "40000000");
  await nextStep(page); await waitField(page, "deudaTransfiere");

  await page.selectOption('[name="deudaTransfiere"]', "quedan");
  await nextStep(page); await waitField(page, "tendencia");

  await page.selectOption('[name="tendencia"]', "crece");
  await page.selectOption('[name="dependenciaDueno"]', "media");
  await page.selectOption('[name="motivoVenta"]', "Retiro");
  await page.getByRole("button", { name: /Calcular mi valuación/ }).click();
  await waitUrl(page, /\/resultado/);
  log("Cálculo ok → teaser");

  // Pago
  await page.getByRole("link", { name: /Desbloquear/ }).click();
  await waitUrl(page, /\/pago/);
  await page.getByRole("button", { name: /Pagar/ }).click();
  await waitUrl(page, /\/completo/);
  const valor = (await page.locator("body").innerText()).match(/USD\s*[\d.]+/);
  log("Pago ok · valor:", valor ? valor[0] : "?");

  // Publicar + revisión
  await page.getByRole("link", { name: /Publicar en el Marketplace/ }).click();
  await page.waitForSelector("text=Armá tu publicación");
  await page.fill('input[placeholder="Tu nombre"]', "Juan Panadero");
  await page.fill('input[placeholder^="WhatsApp"]', "+54 9 351 1234567");
  await page.fill('input[placeholder="Email"]', "juan@panaderia.com");
  // Subida real de una foto
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEUlEQVR42mNk+M9QzwAEjDAGACtVAv8AKG0LAAAAAElFTkSuQmCC",
    "base64",
  );
  await page.setInputFiles('input[type=file]', { name: "foto.png", mimeType: "image/png", buffer: png });
  await page.waitForSelector('img[src^="/api/media/"]', { timeout: 15000 });
  log("Foto subida (miniatura visible)");
  await page.getByRole("button", { name: /Ver vista previa/ }).click();
  await waitUrl(page, /\/publicacion/);
  await page.getByRole("button", { name: /Enviar a revisión/ }).click();
  await page.getByText(/en revisión/i).waitFor({ timeout: 20000 });
  log("Enviada a revisión");

  // Seguridad: vendedor no entra al admin
  await page.goto(`${BASE}/admin/moderacion`, { waitUntil: "networkidle" });
  log("Vendedor bloqueado del admin:", !/cola de revisión/i.test(await page.locator("body").innerText()));

  // Admin aprueba
  const ctxA = await browser.newContext();
  const admin = await ctxA.newPage();
  await admin.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await admin.fill('[name="email"]', "admin@nexonegocios.local");
  await admin.fill('[name="password"]', "admin1234");
  await admin.getByRole("button", { name: /Ingresar/ }).click();
  await admin.waitForTimeout(2500);
  for (let k = 0; k < 8; k++) {
    await admin.goto(`${BASE}/admin/moderacion`, { waitUntil: "networkidle" });
    const btns = admin.getByRole("button", { name: /Aprobar y publicar/ });
    if ((await btns.count()) === 0) break;
    await admin.locator('input[name="cuit"]').first().check();
    await btns.first().click();
    await admin.waitForTimeout(1500);
  }
  log("Admin aprobó pendientes");
  await ctxA.close();

  // Vendedor: ver publicación + contacto
  await page.goto(`${BASE}/valuar/${id}/publicacion`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Ver mi publicación online/ }).click();
  await waitUrl(page, /\/empresa\//);
  log("Ficha muestra la foto:", (await page.locator('img[src^="/api/media/"]').count()) > 0);
  await page.fill('input[placeholder="Tu nombre *"]', "Comprador Interesado");
  await page.fill('input[placeholder="Email"]', "comprador@test.com");
  await page.fill('textarea[placeholder="Tu consulta"]', "Me interesa, ¿podemos hablar?");
  await page.getByRole("button", { name: /Enviar consulta y ver contacto/ }).click();
  await page.getByText(/Contactá al vendedor/).waitFor({ timeout: 20000 });
  log("Contacto revelado:", (await page.locator("body").innerText()).includes("+54 9 351 1234567"));

  // Flyer + panel
  const flyerRes = await ctxS.request.get(`${BASE}/api/flyer/${id}?f=story`);
  const fbuf = await flyerRes.body();
  log("Flyer PNG:", flyerRes.status(), fbuf[0] === 0x89 && fbuf[1] === 0x50, fbuf.length, "bytes");

  await page.goto(`${BASE}/panel/${id}`, { waitUntil: "networkidle" });
  log("Detalle muestra la consulta:", (await page.locator("body").innerText()).includes("Comprador Interesado"));

  console.log("\n✅ E2E COMPLETO (Fases 1-5, con auth)");
} catch (e) {
  console.error("\n❌ E2E FALLÓ:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
