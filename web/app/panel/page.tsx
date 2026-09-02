import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId, getRol } from "@/lib/session";
import { signOut } from "@/auth";
import { fmtUSD } from "@/lib/formato";
import Logo from "@/components/Logo";
import { darDeBajaPublicacion, reactivarPublicacion } from "./actions";

export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  CALCULADA: "Sin pagar",
  PAGA: "Pagada",
  PUBLICACION_EN_ARMADO: "Armando publicación",
  EN_REVISION: "En revisión",
  PUBLICADA: "Publicada",
  RECHAZADA: "Rechazada",
};

// S13 — Panel del vendedor.
export default async function PanelPage() {
  const userId = await requireUserId();
  const esAdmin = (await getRol()) === "ADMIN";
  const valuaciones = await prisma.valuacion.findMany({
    where: { userId },
    include: {
      resultado: true,
      publicacion: { include: { _count: { select: { leads: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-base"><Logo /></Link>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nexo">Mis valuaciones</h1>
        <div className="flex items-center gap-3">
          {esAdmin && (
            <Link href="/admin/moderacion" className="rounded-lg border border-nexo px-3 py-2 text-sm font-medium text-nexo hover:bg-nexo-soft">
              Moderación
            </Link>
          )}
          <Link href="/valuar" className="rounded-lg bg-nexo px-4 py-2 text-sm font-semibold text-white hover:bg-nexo-dark">
            + Nueva valuación
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-sm text-slate-500 hover:text-nexo">Salir</button>
          </form>
        </div>
      </div>

      {valuaciones.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Todavía no tenés valuaciones. <Link href="/valuar" className="text-nexo underline">Empezá una</Link>.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {valuaciones.map((v) => {
          const pub = v.publicacion;
          const bajaDelDueno = v.estado === "PUBLICADA" && pub?.estadoPub === "PAUSADA";
          const dias =
            pub?.fechaVencimiento && v.estado === "PUBLICADA" && !bajaDelDueno
              ? Math.max(0, Math.ceil((pub.fechaVencimiento.getTime() - Date.now()) / 86400000))
              : null;
          return (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400">{v.codigo}</div>
                  <div className="font-semibold text-slate-900">{pub?.titulo ?? "Valuación en progreso"}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{bajaDelDueno ? "Dada de baja" : ESTADO_LABEL[v.estado]}</span>
                    {v.resultado && v.estado !== "BORRADOR" && v.estado !== "CALCULADA" && (
                      <span className="text-slate-500">{fmtUSD(v.resultado.valorCentralUsd)}</span>
                    )}
                    {dias != null && <span className="text-slate-400">· {dias} días restantes</span>}
                    {pub && <span className="text-nexo">· {pub._count.leads} consulta(s)</span>}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Accion v={v} bajaDelDueno={bajaDelDueno} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function Accion({ v, bajaDelDueno }: { v: { id: string; estado: string; publicacion: { codigo: string } | null }; bajaDelDueno: boolean }) {
  const id = v.id;
  const btn = "rounded-lg border border-nexo px-3 py-1.5 text-nexo hover:bg-nexo-soft";
  const btnSoft = "rounded-lg px-3 py-1.5 text-slate-500 hover:text-nexo";
  const btnBaja = "rounded-lg px-3 py-1.5 text-red-500 hover:text-red-700";
  switch (v.estado) {
    case "BORRADOR":
      return <Link href={`/valuar/${id}`} className={btn}>Continuar</Link>;
    case "CALCULADA":
      return <Link href={`/valuar/${id}/resultado`} className={btn}>Desbloquear</Link>;
    case "PAGA":
      return (
        <>
          <Link href={`/valuar/${id}/completo`} className={btn}>Ver resultado</Link>
          <Link href={`/valuar/${id}/publicar`} className={btnSoft}>Publicar</Link>
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className={btnSoft}>Informe PDF</a>
          <Link href={`/valuar/${id}`} className={btnSoft}>Ajustar respuestas</Link>
        </>
      );
    case "PUBLICACION_EN_ARMADO":
      return (
        <>
          <Link href={`/valuar/${id}/publicacion`} className={btn}>Continuar publicación</Link>
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className={btnSoft}>Informe PDF</a>
          <Link href={`/valuar/${id}`} className={btnSoft}>Ajustar respuestas</Link>
        </>
      );
    case "EN_REVISION":
      return (
        <>
          <span className="text-slate-400">Esperando aprobación…</span>
          <Link href={`/valuar/${id}/publicar`} className={btnSoft}>Editar publicación</Link>
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className={btnSoft}>Informe PDF</a>
        </>
      );
    case "PUBLICADA":
      if (bajaDelDueno) {
        // Dada de baja por el dueño: ofrecer reactivar (contenido ya aprobado, sin re-moderar).
        return (
          <>
            <form action={reactivarPublicacion.bind(null, id)}>
              <button className={btn}>Reactivar publicación</button>
            </form>
            <Link href={`/valuar/${id}/publicar`} className={btnSoft}>Editar publicación</Link>
            <Link href={`/panel/${id}`} className={btnSoft}>Ver consultas</Link>
            <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className={btnSoft}>Informe PDF</a>
          </>
        );
      }
      return (
        <>
          <Link href={`/empresa/${v.publicacion?.codigo}`} className={btn}>Ver publicación</Link>
          <Link href={`/valuar/${id}/publicar`} className={btnSoft}>Editar publicación</Link>
          <Link href={`/panel/${id}`} className={btnSoft}>Ver consultas</Link>
          <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className={btnSoft}>Informe PDF</a>
          <a href={`/api/flyer/${id}?f=story`} target="_blank" rel="noopener" className={btnSoft}>Flyer story</a>
          <a href={`/api/flyer/${id}?f=post`} target="_blank" rel="noopener" className={btnSoft}>Flyer post</a>
          <Link href={`/valuar/${id}`} className={btnSoft}>Ajustar respuestas</Link>
          <form action={darDeBajaPublicacion.bind(null, id)}>
            <button className={btnBaja}>Dar de baja</button>
          </form>
        </>
      );
    case "RECHAZADA":
      return <Link href={`/valuar/${id}/publicar`} className={btnSoft}>Revisar y reenviar</Link>;
    default:
      return null;
  }
}
