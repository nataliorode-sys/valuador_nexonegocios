import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtUSD, fmtARS } from "@/lib/formato";
import { RangoBar, BarChart, BarLegend, DriversChart } from "@/components/charts";

export const dynamic = "force-dynamic";

interface Escenarios { conservador: number; base: number; optimista: number }
interface FilaDcf { anio: number; ventas: number; ebitda: number; fcf: number; vp: number }
interface Driver { factor: string; efecto: string; detalle: string }
interface Flags { noRentable: boolean; assetHeavy: boolean; grande: boolean; dcfAplicado: boolean }

const METODO_LABEL: Record<string, string> = {
  multiplos: "Múltiplos de mercado",
  dcf: "Flujo de fondos",
  mixto: "Múltiplos + flujo de fondos",
  activos: "Valor por activos",
};

// S9 — Resultado completo (post-pago).
export default async function CompletoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: { resultado: true, perfil: true },
  });
  if (!val || !val.resultado) notFound();
  if (val.estado === "CALCULADA" || val.estado === "BORRADOR") redirect(`/valuar/${id}/resultado`);

  const r = val.resultado;
  const esc = r.escenarios as unknown as Escenarios;
  const dcf = (r.tablaDcf as unknown as FilaDcf[] | null) ?? null;
  const drivers = (r.drivers as unknown as Driver[]) ?? [];
  const flags = r.flags as unknown as Flags;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Informe {val.codigo}</div>
        <Link href={`/valuar/${id}/informe`} className="rounded-lg border border-nexo px-4 py-2 text-sm font-medium text-nexo hover:bg-nexo-soft">
          Ver informe PDF
        </Link>
      </div>

      {/* Valor + rango */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-sm text-slate-500">Valor orientativo de tu empresa</div>
        <div className="mt-1 text-4xl font-bold text-nexo">{fmtUSD(r.valorCentralUsd)}</div>
        <div className="text-slate-500">≈ {fmtARS(r.valorCentralArs)}</div>
        <div className="mt-6">
          <RangoBar min={r.rangoMinUsd} central={r.valorCentralUsd} max={r.rangoMaxUsd} />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Método predominante: <strong>{METODO_LABEL[r.metodoPredominante] ?? r.metodoPredominante}</strong> ·
          Precisión de la estimación: {val.precisionPct}%
        </p>
      </section>

      {/* Avisos segun flags */}
      {flags?.noRentable && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tu negocio hoy no muestra rentabilidad, por eso la orientación se acerca al valor de sus activos.
          Un negocio rentable suele valer bastante más.
        </div>
      )}

      {/* Escenarios */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { l: "Conservador", v: esc.conservador, c: "border-slate-200" },
          { l: "Base", v: esc.base, c: "border-nexo bg-nexo-soft" },
          { l: "Optimista", v: esc.optimista, c: "border-slate-200" },
        ].map((s) => (
          <div key={s.l} className={`rounded-xl border p-4 text-center ${s.c}`}>
            <div className="text-xs uppercase text-slate-500">{s.l}</div>
            <div className="mt-1 text-lg font-bold text-nexo">{fmtUSD(s.v)}</div>
          </div>
        ))}
      </section>

      {/* Valores por metodo */}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Cómo se compara cada método</h3>
          <div className="mt-3">
            {(() => {
              const data = [
                { label: "Múltiplos", value: r.valorMultiplosUsd },
                { label: "Flujo", value: r.valorDcfUsd ?? 0 },
                { label: "Activos", value: r.valorActivosUsd },
              ];
              return (<><BarChart data={data} /><BarLegend data={data} /></>);
            })()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Tus números (normalizados, USD)</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <Row k="Ganancia del dueño (SDE)" v={fmtUSD(r.sdeUsd)} />
            <Row k="EBITDA normalizado" v={fmtUSD(r.ebitdaUsd)} />
            <Row k="Múltiplo aplicado" v={`${r.multiploFinal}×`} />
            <Row k="Tamaño" v={r.claseTamanio} />
          </dl>
        </div>
      </section>

      {/* Flujo de fondos */}
      {dcf && (
        <section className="mt-6 rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Flujo de fondos proyectado (5 años)</h3>
          <div className="mt-3">
            {(() => {
              const data = dcf.map((f) => ({ label: `Año ${f.anio}`, value: Math.max(0, f.fcf) }));
              return (<><BarChart data={data} /><BarLegend data={data} /></>);
            })()}
          </div>
        </section>
      )}

      {/* Drivers */}
      {drivers.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Qué influye en tu valor</h3>
          <div className="mt-4"><DriversChart drivers={drivers} /></div>
        </section>
      )}

      {/* Proximos pasos */}
      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener"
          className="flex-1 rounded-lg bg-nexo px-6 py-3 text-center font-semibold text-white hover:bg-nexo-dark">
          Descargar informe PDF
        </a>
        <button disabled className="flex-1 cursor-not-allowed rounded-lg border border-slate-300 px-6 py-3 text-center font-semibold text-slate-400">
          Publicar en el Marketplace (Fase 3)
        </button>
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        Orientación basada en información provista por el propietario, no verificada. No constituye
        tasación ni asesoramiento. La decisión del precio de venta es del propietario.
      </p>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-700">{v}</dd>
    </div>
  );
}
