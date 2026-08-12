import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtUSD, fmtARS } from "@/lib/formato";
import { RangoBar, BarChart, BarLegend, DriversChart } from "@/components/charts";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

interface Escenarios { conservador: number; base: number; optimista: number }
interface FilaDcf { anio: number; ventas: number; ebitda: number; fcf: number; vp: number }
interface Driver { factor: string; efecto: string; detalle: string }

// Informe de valuacion (ver docs/05-informe-pdf.md). Optimizado para impresion A4.
export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: { resultado: true, perfil: true },
  });
  if (!val || !val.resultado) notFound();
  if (val.estado === "CALCULADA" || val.estado === "BORRADOR") redirect(`/valuar/${id}/resultado`);

  const r = val.resultado;
  const p = (val.perfil?.datos ?? {}) as Record<string, unknown>;
  const esc = r.escenarios as unknown as Escenarios;
  const dcf = (r.tablaDcf as unknown as FilaDcf[] | null) ?? null;
  const drivers = (r.drivers as unknown as Driver[]) ?? [];
  const dcfData = dcf?.map((f) => ({ label: `Año ${f.anio}`, value: Math.max(0, f.fcf) })) ?? [];

  return (
    <div className="mx-auto max-w-[820px] bg-white px-10 py-8 text-slate-800 print:px-0 print:py-0">
      <style>{`@media print { .no-print { display:none } @page { margin: 16mm } .page-break { page-break-before: always } }`}</style>

      {/* Barra de acciones (no imprime) */}
      <div className="no-print mb-6 flex justify-between">
        <a href={`/valuar/${id}/completo`} className="text-sm text-slate-500">← Volver</a>
        <PrintButton />
      </div>

      {/* Portada / encabezado */}
      <header className="border-b-2 border-nexo pb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg"><Logo /></span>
          <div className="text-right text-xs text-slate-400">
            Informe {val.codigo}<br />TC ref: {r ? val.tcRef?.toLocaleString("es-AR") : "—"} ARS/USD
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Informe de Orientación de Valuación</h1>
        <p className="text-slate-500">
          {String(p.actividadDesc ?? "Empresa")} · {String(p.localidad ?? "")}, {String(p.provincia ?? "")}
        </p>
      </header>

      {/* Aviso */}
      <p className="mt-4 rounded bg-slate-50 p-3 text-xs text-slate-500">
        Documento <strong>orientativo</strong> basado en información provista por el propietario,
        <strong> no verificada</strong> por NexoNegocios. No es una tasación, pericia ni asesoramiento
        financiero. Ver disclaimer completo al final.
      </p>

      {/* 1. Resumen ejecutivo */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">1. Resumen ejecutivo</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500">Valor orientativo</div>
          <div className="text-3xl font-bold text-nexo">{fmtUSD(r.valorCentralUsd)}</div>
          <div className="text-slate-500">≈ {fmtARS(r.valorCentralArs)}</div>
          <div className="mt-4"><RangoBar min={r.rangoMinUsd} central={r.valorCentralUsd} max={r.rangoMaxUsd} /></div>
          <p className="mt-3 text-sm text-slate-600">
            Rango estimado: {fmtUSD(r.rangoMinUsd)} – {fmtUSD(r.rangoMaxUsd)}. Precisión de la
            estimación: {val.precisionPct}%.
          </p>
        </div>
      </section>

      {/* 2. Perfil */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">2. Perfil del negocio</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            <TR k="Actividad" v={String(p.actividadDesc ?? "—")} />
            <TR k="Ubicación" v={`${String(p.localidad ?? "—")}, ${String(p.provincia ?? "—")}`} />
            <TR k="Empleados" v={String(p.empleados ?? "—")} />
            <TR k="Local" v={String(p.local ?? "—")} />
            <TR k="Se incluye en la venta" v={(p.incluyeVenta as string[] | undefined)?.join(", ") ?? "—"} />
          </tbody>
        </table>
      </section>

      {/* 3. Situacion economica */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">3. Situación económica (normalizada, USD)</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            <TR k="Ganancia del dueño (SDE)" v={fmtUSD(r.sdeUsd)} />
            <TR k="EBITDA normalizado" v={fmtUSD(r.ebitdaUsd)} />
            <TR k="Base usada" v={r.baseGanancia} />
            <TR k="Tamaño de la empresa" v={r.claseTamanio} />
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">
          Normalizamos tu resultado sumando gastos personales y ajustando el sueldo del dueño, para
          reflejar lo que gana el negocio en manos de otro dueño.
        </p>
      </section>

      {/* 4. Metodologia + metodos */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">4. Metodología</h2>
        <p className="mt-2 text-sm text-slate-600">
          Trabajamos en dólares para evitar la distorsión de la inflación. Triangulamos tres métodos:
          múltiplos de mercado (según tu rubro y riesgo), flujo de fondos proyectado y valor de tus
          activos (piso). Aplicamos un múltiplo de <strong>{r.multiploFinal}×</strong> ajustado por el
          riesgo de tu negocio.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            {(() => {
              const data = [
                { label: "Múltiplos", value: r.valorMultiplosUsd },
                { label: "Flujo", value: r.valorDcfUsd ?? 0 },
                { label: "Activos", value: r.valorActivosUsd },
              ];
              return (<><BarChart data={data} height={140} /><BarLegend data={data} /></>);
            })()}
          </div>
          <table className="w-full text-sm">
            <tbody>
              <TR k="Por múltiplos" v={fmtUSD(r.valorMultiplosUsd)} />
              <TR k="Por flujo de fondos" v={r.valorDcfUsd != null ? fmtUSD(r.valorDcfUsd) : "n/a"} />
              <TR k="Por activos" v={fmtUSD(r.valorActivosUsd)} />
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. DCF */}
      {dcf && (
        <section className="mt-6 page-break">
          <h2 className="text-lg font-bold text-nexo">5. Flujo de fondos proyectado</h2>
          <div className="mt-3"><BarChart data={dcfData} height={140} /><BarLegend data={dcfData} /></div>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-1">Año</th><th>Ventas</th><th>EBITDA</th><th>Flujo</th><th>Valor presente</th>
              </tr>
            </thead>
            <tbody>
              {dcf.map((f) => (
                <tr key={f.anio} className="border-b border-slate-100">
                  <td className="py-1">{f.anio}</td>
                  <td>{fmtUSD(Math.round(f.ventas))}</td>
                  <td>{fmtUSD(Math.round(f.ebitda))}</td>
                  <td>{fmtUSD(Math.round(f.fcf))}</td>
                  <td>{fmtUSD(Math.round(f.vp))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 6. Escenarios */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">6. Escenarios</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded border border-slate-200 p-3"><div className="text-xs text-slate-500">Conservador</div><div className="font-bold text-nexo">{fmtUSD(esc.conservador)}</div></div>
          <div className="rounded border border-nexo bg-nexo-soft p-3"><div className="text-xs text-slate-500">Base</div><div className="font-bold text-nexo">{fmtUSD(esc.base)}</div></div>
          <div className="rounded border border-slate-200 p-3"><div className="text-xs text-slate-500">Optimista</div><div className="font-bold text-nexo">{fmtUSD(esc.optimista)}</div></div>
        </div>
      </section>

      {/* 7. Drivers */}
      {drivers.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-nexo">7. Qué influye en tu valor</h2>
          <div className="mt-3"><DriversChart drivers={drivers} /></div>
        </section>
      )}

      {/* 8. Conclusiones */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-nexo">8. Conclusión y recomendación</h2>
        <p className="mt-2 text-sm text-slate-600">
          Como orientación, el valor de tu empresa se ubica en un rango de {fmtUSD(r.rangoMinUsd)} a
          {" "}{fmtUSD(r.rangoMaxUsd)}. Sugerimos usar este rango como referencia para fijar tu precio
          de publicación; <strong>la decisión final del precio es tuya</strong>, y con ella también
          el éxito de la venta.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="mt-8 border-t border-slate-200 pt-4">
        <h3 className="text-xs font-bold uppercase text-slate-400">Aviso legal</h3>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          Este informe es una orientación no vinculante generada automáticamente a partir de datos
          provistos por el propietario, sin verificación por parte de NexoNegocios. No constituye una
          tasación, pericia, auditoría ni recomendación de compra/venta o asesoramiento financiero,
          legal o impositivo. El valor real de una transacción depende de la negociación, la debida
          diligencia y las condiciones de mercado. NexoNegocios no garantiza la venta ni el precio y
          no interviene en la negociación (producto NexoDirecto). Validez sujeta al contexto macro y
          al tipo de cambio vigentes a la fecha. Generado con la versión de motor {r.engineVersion}.
        </p>
      </section>
    </div>
  );
}

function TR({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1 text-slate-500">{k}</td>
      <td className="py-1 text-right font-medium text-slate-700">{v}</td>
    </tr>
  );
}
