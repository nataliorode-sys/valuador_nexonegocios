import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function chromePath() {
  const base = "/opt/pw-browsers";
  const dir = readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
  return dir ? join(base, dir, "chrome-linux", "chrome") : undefined;
}

const BASE = "http://127.0.0.1:3000";
const log = (...a) => console.log("•", ...a);

const browser = await chromium.launch({ headless: true, executablePath: chromePath() });
const ctx = await browser.newContext();
const page = await ctx.newPage();

async function waitField(name) {
  await page.waitForSelector(`[name="${name}"]`, { timeout: 15000 });
}
async function next() {
  await page.getByRole("button", { name: /Siguiente/ }).click();
}

try {
  // 1) Elegibilidad
  await page.goto(`${BASE}/valuar`, { waitUntil: "networkidle" });
  await page.selectOption('[name="familia"]', "gastronomia");
  await page.selectOption('[name="enMarcha"]', "si");
  await page.fill('[name="antiguedad"]', "6");
  await page.selectOption('[name="facturacionRango"]', "50_300m");
  await page.selectOption('[name="datosMano"]', "si");
  await Promise.all([
    page.waitForURL(/\/valuar\/[0-9a-f]{8}/, { timeout: 20000 }),
    page.getByRole("button", { name: /Continuar/ }).click(),
  ]);
  const id = page.url().split("/valuar/")[1];
  log("Valuacion creada:", id);

  // 2) W1 Identidad
  await waitField("actividadDesc");
  await page.fill('[name="actividadDesc"]', "Panaderia y cafeteria de barrio con venta al publico y delivery");
  await page.selectOption('[name="provincia"]', "Córdoba");
  await page.fill('[name="localidad"]', "Villa Carlos Paz");
  await page.fill('[name="anioInicio"]', "2018");
  await page.fill('[name="empleados"]', "8");
  await page.fill('[name="duenosTrabajan"]', "2");
  await page.selectOption('[name="local"]', "alquilado");
  await next(); await waitField("monedaCarga");
  log("W1 ok");

  // 3) W2 Ventas
  await page.selectOption('[name="monedaCarga"]', "ARS");
  await page.selectOption('[name="ventasCargaModo"]', "anual");
  await page.fill('[name="ventasAnual"]', "240000000");
  await page.selectOption('[name="anioRepresentativo"]', "normal");
  await next(); await waitField("cogsModo");
  log("W2 ok");

  // 4) W3 Costos
  await page.selectOption('[name="cogsModo"]', "pct");
  await page.fill('[name="cogsPct"]', "38");
  await page.fill('[name="gAlquiler"]', "1200000");
  await page.fill('[name="gSueldos"]', "3000000");
  await page.fill('[name="gOtros"]', "1000000");
  await next(); await waitField("retiroDuenos");
  log("W3 ok");

  // 5) W4 Normalizacion
  await page.fill('[name="retiroDuenos"]', "2000000");
  await page.fill('[name="sueldoMercadoDueno"]', "1500000");
  await page.fill('[name="gastosPersonales"]', "3000000");
  await next(); await waitField("inventario");
  log("W4 ok");

  // 6) W5 Activos
  await page.fill('[name="inventario"]', "8000000");
  await page.fill('[name="equipamiento"]', "40000000");
  await next(); await waitField("deudaTransfiere");
  log("W5 ok");

  // 7) W6 Deudas
  await page.selectOption('[name="deudaTransfiere"]', "quedan");
  await next(); await waitField("tendencia");
  log("W6 ok");

  // 8) W7 Perspectivas + Calcular
  await page.selectOption('[name="tendencia"]', "crece");
  await page.selectOption('[name="dependenciaDueno"]', "media");
  await page.selectOption('[name="motivoVenta"]', "Retiro");
  await Promise.all([
    page.waitForURL(/\/resultado/, { timeout: 20000 }),
    page.getByRole("button", { name: /Calcular mi valuación/ }).click(),
  ]);
  log("Cálculo ok → teaser");

  // 9) Teaser: el valor debe estar OCULTO
  const teaserText = await page.locator("body").innerText();
  const valorOculto = teaserText.includes("●●●") && !/USD\s*\d{2,}/.test(teaserText.replace(/●/g, ""));
  log("Teaser con valor oculto:", valorOculto);

  // 10) Pago (mock)
  await Promise.all([
    page.waitForURL(/\/pago/, { timeout: 20000 }),
    page.getByRole("link", { name: /Desbloquear/ }).click(),
  ]);
  await Promise.all([
    page.waitForURL(/\/completo/, { timeout: 20000 }),
    page.getByRole("button", { name: /Pagar/ }).click(),
  ]);
  log("Pago ok → resultado completo");

  // 11) Resultado completo: el valor debe estar VISIBLE
  const bodyCompleto = await page.locator("body").innerText();
  const valorMatch = bodyCompleto.match(/USD\s*[\d.]+/);
  log("Valor visible en /completo:", valorMatch ? valorMatch[0] : "NO ENCONTRADO");

  // 12) PDF
  const pdfRes = await ctx.request.get(`${BASE}/api/informe/${id}/pdf`);
  const buf = await pdfRes.body();
  const isPdf = buf.slice(0, 5).toString() === "%PDF-";
  log("PDF status:", pdfRes.status(), "| es PDF:", isPdf, "| bytes:", buf.length);

  // ===== Fase 3: publicar → moderar → marketplace → contacto =====

  // 13) Armado de publicación
  await page.goto(`${BASE}/valuar/${id}/completo`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Publicar en el Marketplace/ }).click();
  await page.waitForSelector("text=Armá tu publicación");
  await page.fill('input[placeholder="Tu nombre"]', "Juan Panadero");
  await page.fill('input[placeholder^="WhatsApp"]', "+54 9 351 1234567");
  await page.fill('input[placeholder="Email"]', "juan@panaderia.com");
  await Promise.all([
    page.waitForURL(/\/publicacion/, { timeout: 20000 }),
    page.getByRole("button", { name: /Ver vista previa/ }).click(),
  ]);
  log("Publicación armada");

  // 14) Enviar a revisión
  await page.getByRole("button", { name: /Enviar a revisión/ }).click();
  await page.getByText(/en revisión/i).waitFor({ timeout: 20000 });
  log("Enviada a revisión");

  // 15) Moderación (admin)
  await page.goto(`${BASE}/admin/moderacion`, { waitUntil: "networkidle" });
  await page.check('input[name="cuit"]');
  await page.check('input[name="google"]');
  await page.getByRole("button", { name: /Aprobar y publicar/ }).click();
  await page.waitForTimeout(2000);
  log("Aprobada en moderación");

  // 16) Marketplace
  await page.goto(`${BASE}/marketplace`, { waitUntil: "networkidle" });
  const cards = await page.locator('a[href^="/empresa/"]').count();
  log("Publicaciones en Marketplace:", cards);
  await page.locator('a[href^="/empresa/"]').first().click();
  await page.waitForURL(/\/empresa\//, { timeout: 20000 });

  // 17) Contacto (relay + reveal)
  await page.fill('input[placeholder="Tu nombre *"]', "Comprador Interesado");
  await page.fill('input[placeholder="Email"]', "comprador@test.com");
  await page.fill('textarea[placeholder="Tu consulta"]', "Me interesa, ¿podemos hablar?");
  await page.getByRole("button", { name: /Enviar consulta y ver contacto/ }).click();
  await page.getByText(/Contactá al vendedor/).waitFor({ timeout: 20000 });
  const contactoRevelado = (await page.locator("body").innerText()).includes("+54 9 351 1234567");
  log("Contacto del vendedor revelado:", contactoRevelado);

  console.log("\n✅ E2E COMPLETO (Fases 1-3)");
} catch (e) {
  console.error("\n❌ E2E FALLÓ:", e.message);
  console.error(await page.locator("body").innerText().catch(() => ""));
  process.exitCode = 1;
} finally {
  await browser.close();
}
