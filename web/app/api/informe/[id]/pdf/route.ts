// Genera el informe PDF renderizando la pagina HTML del informe con Chromium.
// Requiere un navegador Chromium disponible (executablePath). Ver docs/05 §5.1.
import { prisma } from "@/lib/prisma";
import { resolveChromium, internalOrigin } from "@/lib/chromium";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const val = await prisma.valuacion.findUnique({ where: { id }, select: { codigo: true, estado: true } });
  if (!val) return new Response("No encontrado", { status: 404 });
  if (val.estado === "BORRADOR" || val.estado === "CALCULADA") {
    return new Response("El informe no está disponible hasta completar el pago.", { status: 402 });
  }

  const url = `${internalOrigin()}/valuar/${id}/informe`;

  try {
    const { chromium } = await import("playwright-core");
    const executablePath = resolveChromium();
    const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
      });
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Informe-${val.codigo}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error generando PDF";
    return new Response(
      `No se pudo generar el PDF automáticamente (${msg}). Usá "Imprimir / Guardar PDF" desde el informe.`,
      { status: 500 },
    );
  }
}
