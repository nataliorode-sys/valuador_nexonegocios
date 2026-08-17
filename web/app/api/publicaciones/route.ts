// API pública de publicaciones NexoDirecto.
// La consume el plugin de WordPress ([nexodirecto]) para mostrar el marketplace
// dentro de nexonegocios.com.ar/empresas-en-venta/, en una sección separada de
// las oportunidades exclusivas/intermediadas.
//
// Devuelve las mismas publicaciones que el marketplace público (aprobadas por
// moderación, publicadas y no vencidas), con los campos que necesita una tarjeta.
// Respeta la privacidad ANÓNIMA (no expone la localidad exacta) y entrega URLs
// absolutas para foto y ficha, de modo que carguen bien en otro dominio.
import { prisma } from "@/lib/prisma";
import { fmtUSD, fmtARS } from "@/lib/formato";
import { familiaLabel } from "@/lib/publicacion";
import { baseUrl } from "@/lib/seo";
import { FAMILIAS, PROVINCIAS } from "@/lib/wizard/steps";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Convierte una URL de foto (que puede ser relativa /api/media/...) en absoluta. */
function urlAbsoluta(u: string | undefined | null): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${baseUrl()}${u.startsWith("/") ? "" : "/"}${u}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const familia = searchParams.get("familia") || undefined;
  const provincia = searchParams.get("provincia") || undefined;
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 60;

  const where: Prisma.PublicacionWhereInput = {
    estadoPub: "PUBLICADA",
    fechaVencimiento: { gt: new Date() },
    valuacion: { estado: "PUBLICADA" }, // solo aprobadas por moderación
  };
  if (familia) where.familia = familia;
  if (provincia) where.provincia = provincia;

  const publicaciones = await prisma.publicacion.findMany({
    where,
    orderBy: { fechaPublicacion: "desc" },
    take: limit,
  });

  const base = baseUrl();
  const items = publicaciones.map((p) => {
    const anon = p.nivelPrivacidad === "ANONIMA";
    const ubicacion = anon
      ? p.provincia ?? null
      : [p.localidad, p.provincia].filter(Boolean).join(", ") || null;
    const highlights = Array.isArray(p.highlights) ? (p.highlights as string[]) : [];
    const precioLabel = p.moneda === "ARS" ? fmtARS(p.precioPublicacion) : fmtUSD(p.precioPublicacion);
    return {
      codigo: p.codigo,
      titulo: p.titulo,
      familia: p.familia,
      rubro: familiaLabel(p.familia),
      provincia: p.provincia ?? null,
      ubicacion,
      precio: p.precioPublicacion,
      moneda: p.moneda,
      precioLabel,
      facturacion: p.facturacionPublica ?? null,
      foto: urlAbsoluta(p.fotos[0]),
      highlights: highlights.slice(0, 3),
      url: `${base}/empresa/${p.codigo}`,
      tipo: "nexodirecto" as const,
    };
  });

  // Taxonomía presente en los resultados, para poblar los filtros del plugin
  // (solo rubros/provincias que efectivamente tienen publicaciones).
  const rubrosPresentes = FAMILIAS.filter((f) => items.some((i) => i.familia === f.value));
  const provinciasPresentes = PROVINCIAS.filter((pr) => items.some((i) => i.provincia === pr.value));

  return Response.json(
    {
      ok: true,
      total: items.length,
      filtros: { rubros: rubrosPresentes, provincias: provinciasPresentes },
      items,
    },
    {
      headers: {
        ...CORS,
        // Cacheable por CDN/proxy 5 min; sirve stale mientras revalida.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
