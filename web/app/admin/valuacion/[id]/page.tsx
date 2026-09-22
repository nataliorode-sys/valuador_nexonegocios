import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { fmtUSD } from "@/lib/formato";
import { ADMIN_GRUPOS } from "./fields";
import { guardarDatosAdmin } from "./actions";

export const dynamic = "force-dynamic";

// Edición de datos de una valuación por el moderador (para corregir cargas mal
// hechas de clientes que no pueden hacerlo). Recalcula al guardar. Solo ADMIN.
export default async function EditarValuacionAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok } = await searchParams;

  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: { perfil: true, resultado: true, user: { select: { email: true, nombre: true } } },
  });
  if (!val?.perfil) notFound();

  const datos = (val.perfil.datos ?? {}) as Record<string, unknown>;
  const flags = (val.resultado?.flags ?? {}) as { gastosSuperanVentas?: boolean; margenSospechoso?: boolean };
  const guardar = guardarDatosAdmin.bind(null, id);

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const strVal = (k: string) => (datos[k] == null ? "" : String(datos[k]));
  const periodo = (k: string) => (datos[`${k}Periodo`] === "anual" ? "anual" : "mensual");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/admin/moderacion" className="text-sm text-slate-500 hover:text-nexo">← Moderación</Link>
      <h1 className="mt-3 text-2xl font-bold text-nexo">Editar valuación · {val.codigo}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {val.user?.nombre ?? "—"} · {val.user?.email} · estado: {val.estado}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div>
          <div className="text-xs text-slate-400">Valor actual</div>
          <div className="text-lg font-bold text-nexo">{val.resultado ? fmtUSD(val.resultado.valorCentralUsd) : "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Precisión</div>
          <div className="text-lg font-bold text-slate-600">{val.precisionPct ?? "—"}%</div>
        </div>
        <a href={`/valuar/${id}/informe`} target="_blank" rel="noopener" className="ml-auto rounded-lg border border-nexo px-3 py-1.5 text-nexo hover:bg-nexo-soft">Ver informe</a>
      </div>

      {ok && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          ✓ Datos guardados y valuación recalculada. Nuevo valor: <strong>{val.resultado ? fmtUSD(val.resultado.valorCentralUsd) : "—"}</strong>.
        </div>
      )}
      {flags.gastosSuperanVentas && (
        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ Los gastos cargados superan las ventas (por eso da muy bajo o cero). Revisá los montos de
          gastos y retiros: suele ser un valor mensual cargado como anual, o un cero de más.
        </div>
      )}

      <form action={guardar} className="mt-6 space-y-8">
        {ADMIN_GRUPOS.map((grupo) => (
          <section key={grupo.titulo}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{grupo.titulo}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {grupo.campos.map((f) => (
                <div key={f.id} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-slate-700">{f.label}</label>
                  {f.kind === "textarea" ? (
                    <textarea name={f.id} rows={3} defaultValue={strVal(f.id)} className={inputCls} />
                  ) : f.kind === "select" ? (
                    <select name={f.id} defaultValue={strVal(f.id)} className={inputCls}>
                      <option value="">—</option>
                      {f.opciones.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : f.kind === "text" ? (
                    <input type="text" name={f.id} defaultValue={strVal(f.id)} className={inputCls} />
                  ) : (
                    <div className="flex gap-2">
                      <input type="number" step="any" name={f.id} defaultValue={strVal(f.id)} className={inputCls} />
                      {f.kind === "moneyP" && (
                        <select name={`${f.id}Periodo`} defaultValue={periodo(f.id)} className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm">
                          <option value="mensual">/mes</option>
                          <option value="anual">/año</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white py-4">
          <Link href="/admin/moderacion" className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-nexo">Cancelar</Link>
          <button className="rounded-lg bg-nexo px-6 py-2.5 text-sm font-semibold text-white hover:bg-nexo-dark">
            Guardar y recalcular
          </button>
        </div>
      </form>
    </main>
  );
}
