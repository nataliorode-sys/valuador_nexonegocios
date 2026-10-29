// Portada de marca para una publicación sin foto. Devuelve un SVG liviano
// (sin Chromium) construido con el título + rubro. La usan como fallback las
// tarjetas, la ficha, el flyer y la API de WordPress.
import { prisma } from "@/lib/prisma";
import { coverSvg } from "@/lib/cover";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const p = await prisma.publicacion.findUnique({
    where: { codigo },
    select: { titulo: true, familia: true },
  });
  const svg = coverSvg({
    titulo: p?.titulo ?? "Empresa en venta",
    familia: p?.familia ?? "otros",
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Cacheable: el título/rubro cambian rara vez; se revalida en segundo plano.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
