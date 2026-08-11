import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// S14 — Detalle de una publicación + consultas recibidas (leads).
export default async function PanelDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: { publicacion: { include: { leads: { orderBy: { createdAt: "desc" } } } } },
  });
  if (!val) notFound();
  if (userId && val.userId !== userId) notFound(); // solo el dueño
  const pub = val.publicacion;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/panel" className="text-sm text-slate-500 hover:text-nexo">← Mis valuaciones</Link>
      <h1 className="mt-3 text-2xl font-bold text-nexo">{pub?.titulo ?? val.codigo}</h1>

      {pub && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={`/empresa/${pub.codigo}`} className="rounded-lg border border-nexo px-3 py-1.5 text-nexo hover:bg-nexo-soft">Ver publicación</Link>
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Informe PDF</a>
          <a href={`/api/flyer/${id}?f=story`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Flyer story</a>
          <a href={`/api/flyer/${id}?f=post`} target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo">Flyer post</a>
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
