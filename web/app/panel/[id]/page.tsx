import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { darDeBajaPublicacion, reactivarPublicacion } from "../actions";

export const dynamic = "force-dynamic";

// Estado de la publicación para el vendedor.
const PUB_ESTADO: Record<string, { t: string; c: string; msg?: string }> = {
  PUBLICADA: { t: "Publicada", c: "bg-emerald-100 text-emerald-800" },
  EN_REVISION: { t: "En revisión", c: "bg-amber-100 text-amber-800", msg: "Tus cambios están siendo revisados por el equipo. Cuando se aprueben, tu publicación vuelve a estar online." },
  PUBLICACION_EN_ARMADO: { t: "Pendiente de enviar", c: "bg-slate-100 text-slate-600", msg: "Tenés cambios sin enviar a revisión. Editá y confirmá para publicarlos." },
  RECHAZADA: { t: "Rechazada", c: "bg-red-100 text-red-700" },
  PAGA: { t: "Pendiente de armar", c: "bg-slate-100 text-slate-600" },
};

// S14 — Detalle de una publicación + consultas recibidas (leads).
export default async function PanelDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision?: string }>;
}) {
  const { id } = await params;
  const { revision } = await searchParams;
  const userId = await requireUserId();
  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: {
      publicacion: {
        include: {
          leads: { orderBy: { createdAt: "desc" } },
          moderaciones: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!val || val.userId !== userId) notFound(); // solo el dueño
  const pub = val.publicacion;
  const estado = PUB_ESTADO[val.estado] ?? null;
  const ultimaMod = pub?.moderaciones[0];
  const online = val.estado === "PUBLICADA" && pub?.estadoPub === "PUBLICADA";
  const bajaDelDueno = val.estado === "PUBLICADA" && pub?.estadoPub === "PAUSADA";
  // Motivo visible cuando el último dictamen fue un rechazo y la publicación no está online.
  const motivoRechazo = !online && ultimaMod?.resultado === "RECHAZADA" ? ultimaMod.motivo : null;
  const puedeEditar = !!pub && ["PUBLICADA", "EN_REVISION", "PUBLICACION_EN_ARMADO"].includes(val.estado);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/panel" className="text-sm text-slate-500 hover:text-nexo">← Mis valuaciones</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-nexo">{pub?.titulo ?? val.codigo}</h1>
        {bajaDelDueno
          ? <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Dada de baja</span>
          : estado && <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + estado.c}>{estado.t}</span>}
      </div>

      {bajaDelDueno && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Tu publicación está <span className="font-semibold">dada de baja</span> y no se muestra en NexoDirecto. Podés reactivarla cuando quieras (mientras siga vigente).
        </div>
      )}

      {revision && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ✓ Enviamos tus cambios a revisión. Mientras tanto, tu publicación no se muestra en el listado; vuelve online apenas se aprueben.
        </div>
      )}

      {estado?.msg && !revision && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{estado.msg}</div>
      )}

      {motivoRechazo && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-semibold">Cambios no aprobados:</span> {motivoRechazo}
          <div className="mt-1 text-red-600">Editá la publicación corrigiendo eso y volvé a enviarla a revisión.</div>
        </div>
      )}

      {pub && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {puedeEditar && (
            <Link href={`/valuar/${id}/publicar`} className="rounded-lg bg-nexo px-3 py-1.5 font-medium text-white hover:bg-nexo-dark">Editar publicación</Link>
          )}
          {online && (
            <Link href={`/empresa/${pub.codigo}`} className="rounded-lg border border-nexo px-3 py-1.5 text-nexo hover:bg-nexo-soft">Ver publicación</Link>
          )}
          {bajaDelDueno && (
            <form action={reactivarPublicacion.bind(null, id)}>
              <button className="rounded-lg border border-nexo px-3 py-1.5 font-medium text-nexo hover:bg-nexo-soft">Reactivar publicación</button>
            </form>
          )}
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Informe PDF</a>
          <a href={`/api/flyer/${id}?f=story`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Flyer story</a>
          <a href={`/api/flyer/${id}?f=post`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Flyer post</a>
          {online && (
            <form action={darDeBajaPublicacion.bind(null, id)}>
              <button className="rounded-lg px-3 py-1.5 text-red-500 hover:text-red-700">Dar de baja</button>
            </form>
          )}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-slate-800">
        Consultas recibidas ({pub?.leads.length ?? 0})
      </h2>
      {!pub || pub.leads.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Todavía no recibiste consultas.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pub.leads.map((l) => (
            <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-800">{l.nombre}</div>
                <div className="text-xs text-slate-400">{l.createdAt.toLocaleDateString("es-AR")}</div>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {[l.email, l.telefono].filter(Boolean).join(" · ") || "sin datos de contacto"}
              </div>
              {l.mensaje && <p className="mt-2 text-sm text-slate-700">{l.mensaje}</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
