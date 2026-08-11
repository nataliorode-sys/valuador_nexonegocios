import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Ficha from "@/components/marketplace/Ficha";
import { assertOwner } from "@/lib/access";
import { enviarARevision } from "../publicar/actions";

export const dynamic = "force-dynamic";

// S11/S12 — Vista previa + envío a revisión.
export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
  const val = await prisma.valuacion.findUnique({ where: { id }, include: { publicacion: true } });
  if (!val || !val.publicacion) notFound();
  const p = val.publicacion;
  const enviar = enviarARevision.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <EstadoBanner estado={val.estado} codigo={p.codigo} fechaVencimiento={p.fechaVencimiento} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Ficha p={p} />
      </div>

      {val.estado === "PUBLICACION_EN_ARMADO" && (
        <div className="mt-6 flex items-center justify-between">
          <Link href={`/valuar/${id}/publicar`} className="text-slate-500 hover:text-nexo">← Editar</Link>
          <form action={enviar}>
            <button className="rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
              Enviar a revisión
            </button>
          </form>
        </div>
      )}
      {val.estado === "PUBLICADA" && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/empresa/${p.codigo}`} className="rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
            Ver mi publicación online
          </Link>
          <a href={`/api/flyer/${id}?f=story`} target="_blank" rel="noopener" className="rounded-lg border border-nexo px-5 py-3 font-medium text-nexo hover:bg-nexo-soft">
            Descargar flyer (story)
          </a>
          <a href={`/api/flyer/${id}?f=post`} target="_blank" rel="noopener" className="rounded-lg border border-nexo px-5 py-3 font-medium text-nexo hover:bg-nexo-soft">
            Flyer (post)
          </a>
          <Link href="/panel" className="text-sm text-slate-500 hover:text-nexo">Ir a mi panel →</Link>
        </div>
      )}
    </main>
  );
}

function EstadoBanner({ estado, codigo, fechaVencimiento }: { estado: string; codigo: string; fechaVencimiento: Date | null }) {
  if (estado === "EN_REVISION")
    return <Banner c="amber">⏳ Tu publicación está <strong>en revisión</strong> por NexoNegocios. Te avisamos cuando esté online.</Banner>;
  if (estado === "PUBLICADA") {
    const dias = fechaVencimiento ? Math.max(0, Math.ceil((fechaVencimiento.getTime() - Date.now()) / 86400000)) : null;
    return <Banner c="emerald">✅ ¡Publicada! Código {codigo}{dias != null ? ` · ${dias} días restantes` : ""}.</Banner>;
  }
  if (estado === "RECHAZADA")
    return <Banner c="red">Tu publicación fue rechazada. Revisá el contenido y volvé a enviarla.</Banner>;
  return <Banner c="slate">Vista previa de tu publicación. Revisá cómo se va a ver antes de enviarla.</Banner>;
}

function Banner({ c, children }: { c: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    red: "border-red-300 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${map[c]}`}>{children}</div>;
}
