// Captura el flyer (pagina HTML) a PNG con Chromium. ?f=story|post
import { prisma } from "@/lib/prisma";
import { resolveChromium } from "@/lib/chromium";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formato = new URL(req.url).searchParams.get("f") === "post" ? "post" : "story";
  const val = await prisma.valuacion.findUnique({ where: { id }, include: { publicacion: true } });
  if (!val || !val.publicacion) return new Response("No encontrado", { status: 404 });

  const origin = new URL(req.url).origin;
  const url = `${origin}/valuar/${id}/flyer?f=${formato}`;
  const W = 1080;
  const H = formato === "story" ? 1920 : 1080;

  try {
    const { chromium } = await import("playwright-core");
    const executablePath = resolveChromium();
    const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    try {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const el = await page.$("#flyer");
      const png = el ? await el.screenshot({ type: "png" }) : await page.screenshot({ type: "png" });
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="Flyer-${val.publicacion.codigo}-${formato}.png"`,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error generando el flyer";
    return new Response(msg, { status: 500 });
  }
}
