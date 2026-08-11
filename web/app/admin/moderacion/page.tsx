import { prisma } from "@/lib/prisma";
import Ficha from "@/components/marketplace/Ficha";
import { requireAdmin } from "@/lib/session";
import { aprobarPublicacion, rechazarPublicacion } from "./actions";

export const dynamic = "force-dynamic";

// A1 — Cola de moderación. Solo ADMIN.
export default async function ModeracionPage() {
  await requireAdmin();
  const pendientes = await prisma.valuacion.findMany({
    where: { estado: "EN_REVISION" },
    include: { publicacion: true },
    orderBy: { updatedAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-nexo">Moderación · cola de revisión</h1>
      <p className="mt-1 text-sm text-slate-500">{pendientes.length} publicación(es) esperando aprobación.</p>

      {pendientes.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          No hay publicaciones pendientes.
        </div>
      )}

      <div className="mt-6 space-y-6">
        {pendientes.map((v) => {
          const p = v.publicacion!;
          const aprobar = aprobarPublicacion.bind(null, p.id);
          const rechazar = rechazarPublicacion.bind(null, p.id);
          return (
            <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-xs text-slate-400">{p.codigo}</div>
              <Ficha p={p} />

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <form action={aprobar} className="rounded-lg bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-800">Verificación de existencia</div>
                  <div className="mt-2 space-y-1 text-sm text-emerald-900">
                    <label className="flex items-center gap-2"><input type="checkbox" name="cuit" /> CUIT / existencia fiscal</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="google" /> Ficha de Google</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="redes" /> Redes sociales</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="web" /> Sitio web</label>
                  </div>
                  <button className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
                    Aprobar y publicar
                  </button>
                </form>

                <form action={rechazar} className="rounded-lg bg-red-50 p-4">
                  <div className="text-sm font-semibold text-red-800">Rechazar</div>
                  <textarea name="motivo" rows={4} placeholder="Motivo del rechazo…"
                    className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm" />
                  <button className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
                    Rechazar (con reembolso)
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
