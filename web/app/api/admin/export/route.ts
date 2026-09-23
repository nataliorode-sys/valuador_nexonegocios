// Export solo-admin de todas las valuaciones (respuestas + resultado + ratios de
// sanidad) para revisión caso a caso. Descarga un JSON.
import { prisma } from "@/lib/prisma";
import { getRol } from "@/lib/session";

export const dynamic = "force-dynamic";

function ventasUsd(datos: Record<string, unknown>, tcRef: number | null): number | null {
  const modo = datos.ventasCargaModo;
  const raw = modo === "promedio" ? Number(datos.ventasProm ?? 0) * 12 : Number(datos.ventasAnual ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const conv = datos.monedaCarga === "USD" ? 1 : tcRef && tcRef > 0 ? tcRef : 1;
  return Math.round(raw / conv);
}

export async function GET() {
  if ((await getRol()) !== "ADMIN") return new Response("No autorizado", { status: 403 });

  const valuaciones = await prisma.valuacion.findMany({
    include: {
      user: { select: { email: true, nombre: true } },
      perfil: true,
      resultado: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const filas = valuaciones.map((v) => {
    const datos = (v.perfil?.datos ?? {}) as Record<string, unknown>;
    const r = v.resultado;
    const vUsd = ventasUsd(datos, v.tcRef);
    const base = r ? (r.baseGanancia === "SDE" ? r.sdeUsd : r.ebitdaUsd) : null;
    return {
      codigo: v.codigo,
      estado: v.estado,
      creada: v.createdAt,
      actualizada: v.updatedAt,
      usuario: { nombre: v.user?.nombre ?? null, email: v.user?.email ?? null },
      precisionPct: v.precisionPct ?? null,
      tcRef: v.tcRef ?? null,
      // Todas las respuestas cargadas por el dueño (crudas).
      respuestas: datos,
      resultado: r
        ? {
            valorCentralUsd: r.valorCentralUsd,
            rangoMinUsd: r.rangoMinUsd,
            rangoMaxUsd: r.rangoMaxUsd,
            sdeUsd: r.sdeUsd,
            ebitdaUsd: r.ebitdaUsd,
            baseGanancia: r.baseGanancia,
            multiploFinal: r.multiploFinal,
            metodoPredominante: r.metodoPredominante,
            valorMultiplosUsd: r.valorMultiplosUsd,
            valorDcfUsd: r.valorDcfUsd,
            valorActivosUsd: r.valorActivosUsd,
            flags: r.flags,
          }
        : null,
      // Ratios de sanidad para escanear outliers de un vistazo.
      sanity: r
        ? {
            ventasUsd: vUsd,
            margenSdePct: vUsd && vUsd > 0 ? Math.round((r.sdeUsd / vUsd) * 100) : null,
            valorSobreVentas: vUsd && vUsd > 0 ? Number((r.valorCentralUsd / vUsd).toFixed(2)) : null,
            multiploEfectivo: base && base > 0 ? Number((r.valorCentralUsd / base).toFixed(2)) : null,
          }
        : null,
    };
  });

  const payload = {
    generadoEn: new Date().toISOString(),
    engineVersion: valuaciones.find((v) => v.engineVersion)?.engineVersion ?? null,
    total: filas.length,
    valuaciones: filas,
  };

  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="nexodirecto-export-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
