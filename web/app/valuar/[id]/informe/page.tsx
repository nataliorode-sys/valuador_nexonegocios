import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtUSD, fmtARS } from "@/lib/formato";
import { RangoBar, BarChart, BarLegend, DriversChart } from "@/components/charts";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/Logo";
import { desglosar } from "@nexodirecto/engine";
import { toEngineInput } from "@/lib/wizard/toEngineInput";
import { interpretar } from "@/lib/interpretacion";
import type { FormData } from "@/lib/wizard/types";

export const dynamic = "force-dynamic";

interface Escenarios { conservador: number; base: number; optimista: number }
interface FilaDcf { anio: number; ventas: number; ebitda: number; fcf: number; vp: number }
interface Driver { factor: string; efecto: string; detalle: string }

const u = (v: number) => fmtUSD(Math.round(v));

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const val = await prisma.valuacion.findUnique({ where: { id }, include: { resultado: true, perfil: true } });
  if (!val || !val.resultado) notFound();
  if (val.estado === "CALCULADA" || val.estado === "BORRADOR") redirect(`/valuar/${id}/resultado`);

  const r = val.resultado;
  const datos = (val.perfil?.datos ?? {}) as FormData & Record<string, unknown>;
  const tcRef = val.tcRef ?? 1200;
  const g = desglosar(toEngineInput(datos, tcRef));
  const esc = r.escenarios as unknown as Escenarios;
  const dcf = (r.tablaDcf as unknown as FilaDcf[] | null) ?? null;
  const drivers = (r.drivers as unknown as Driver[]) ?? [];
  const analisis = interpretar(
    datos as never,
    { familia: r.familia, baseGanancia: r.baseGanancia, metodoPredominante: r.metodoPredominante, multiploFinal: r.multiploFinal, sdeUsd: r.sdeUsd, ebitdaUsd: r.ebitdaUsd, flags: r.flags as never },
    g,
  );
  const dcfData = dcf?.map((f) => ({ label: `Año ${f.anio}`, value: Math.max(0, f.fcf) })) ?? [];
  const antiguedad = Number(datos.anioInicio) > 0 ? 2026 - Number(datos.anioInicio) : null;

  return (
    <div className="mx-auto max-w-[820px] bg-white px-10 py-8 text-slate-800 print:px-0 print:py-0">
      <style>{`@media print { .no-print{display:none} @page{margin:15mm} .pb{page-break-before:always} } h2{color:#0B1C2E}`}</style>

      <div className="no-print mb-6 flex justify-between">
        <a href={`/valuar/${id}/completo`} className="text-sm text-slate-500">← Volver</a>
        <PrintButton />
      </div>

      {/* Portada */}
      <header className="border-b-2 border-nexo pb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg"><Logo /></span>
          <div className="text-right text-xs text-slate-400">
            Informe {val.codigo}<br />TC ref (USD): ${tcRef.toLocaleString("es-AR")}
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-nexo">Informe de Orientación de Valuación</h1>
        <p className="text-slate-500">{String(datos.actividadDesc ?? "Empresa")} · {String(datos.localidad ?? "")}, {String(datos.provincia ?? "")}</p>
      </header>

      <p className="mt-4 rounded bg-slate-50 p-3 text-xs text-slate-500">
        Documento <strong>orientativo</strong> basado en información provista por el propietario,
        <strong> no verificada</strong>. No es una tasación, pericia ni asesoramiento. Ver disclaimer al final.
      </p>

      {/* 1. Resumen ejecutivo */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">1. Resumen ejecutivo</h2>
        <div className="mt-3 rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500">Valor orientativo</div>
          <div className="text-3xl font-bold text-nexo">{u(r.valorCentralUsd)}</div>
          <div className="text-slate-500">≈ {fmtARS(r.valorCentralArs)}</div>
          <div className="mt-4"><RangoBar min={r.rangoMinUsd} central={r.valorCentralUsd} max={r.rangoMaxUsd} /></div>
          <p className="mt-3 text-sm text-slate-600">Rango estimado: {u(r.rangoMinUsd)} – {u(r.rangoMaxUsd)}. Precisión: {val.precisionPct}%.</p>
        </div>
      </section>

      {/* 2. Tu negocio */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">2. Tu negocio</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            <TR k="Actividad" v={String(datos.actividadDesc ?? "—")} />
            <TR k="Ubicación" v={`${String(datos.localidad ?? "—")}, ${String(datos.provincia ?? "—")}`} />
            <TR k="Antigüedad" v={antiguedad ? `${antiguedad} años` : "—"} />
            <TR k="Empleados" v={String(datos.empleados ?? "—")} />
            <TR k="Local" v={String(datos.local ?? "—")} />
            <TR k="Se incluye en la venta" v={(datos.incluyeVenta as string[] | undefined)?.join(", ") ?? "—"} />
            <TR k="Motivo de venta" v={String(datos.motivoVenta ?? "—")} />
          </tbody>
        </table>
      </section>

      {/* 3. Situación económica */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">3. Situación económica (normalizada, en USD)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Partimos de tus ventas y le restamos costos y gastos para llegar a lo que realmente gana el
          negocio. Ajustamos algunos valores para reflejar su capacidad real de generar ganancias.
        </p>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <PL k="Ventas anuales" v={u(g.ventas)} bold />
            <PL k="− Costo de mercadería / insumos" v={u(g.cogs)} nota="Lo que cuesta lo que vendés." />
            <PL k="− Gastos fijos (sin retiros de dueños)" v={u(g.gastosFijos)} nota="Alquiler, sueldos, servicios, etc." />
            <PL k="= Resultado antes del dueño" v={u(g.resultadoOperativo)} bold />
            {g.gastosPersonales > 0 && <PL k="+ Gastos personales por la empresa" v={u(g.gastosPersonales)} nota="Se suman porque no son del negocio." />}
            {g.extraordGasto > 0 && <PL k="+ Gastos por única vez" v={u(g.extraordGasto)} />}
            {g.extraordIngreso > 0 && <PL k="− Ingresos por única vez" v={u(g.extraordIngreso)} />}
            <PL k="= SDE (ganancia del dueño)" v={u(g.sde)} bold hi />
            <PL k="− Sueldo de mercado del dueño" v={u(g.sueldoMercadoDueno)} nota="Lo que costaría contratar a alguien en su lugar." />
            <PL k="= EBITDA normalizado" v={u(g.ebitda)} bold hi />
          </tbody>
        </table>
        <p className="mt-3 rounded bg-nexo-soft p-3 text-sm text-slate-700">💡 {analisis.margenTexto}</p>
      </section>

      {/* 4. Cómo llegamos al valor */}
      <section className="mt-6 pb">
        <h2 className="text-lg font-bold">4. Cómo llegamos al valor</h2>
        <p className="mt-2 text-sm text-slate-600">{analisis.metodoTexto}</p>
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
              <TR k="Por múltiplos" v={u(r.valorMultiplosUsd)} />
              <TR k="Por flujo de fondos" v={r.valorDcfUsd != null ? u(r.valorDcfUsd) : "n/a"} />
              <TR k="Por activos" v={u(r.valorActivosUsd)} />
              <TR k="Múltiplo aplicado" v={`${r.multiploFinal}×`} />
            </tbody>
          </table>
        </div>
        {drivers.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-slate-700">Qué influye en tu valor</h3>
            <div className="mt-2"><DriversChart drivers={drivers} /></div>
          </>
        )}
      </section>

      {/* 5. Flujo de fondos */}
      {dcf && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">5. Flujo de fondos proyectado (5 años)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Proyectamos el dinero que genera tu negocio y lo traemos a valor de hoy (una empresa vale
            por lo que va a generar en el futuro).
          </p>
          <div className="mt-3"><BarChart data={dcfData} height={130} /><BarLegend data={dcfData} /></div>
          <table className="mt-3 w-full text-xs">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-1">Año</th><th>Ventas</th><th>EBITDA</th><th>Flujo</th><th>Valor presente</th></tr></thead>
            <tbody>
              {dcf.map((f) => (
                <tr key={f.anio} className="border-b border-slate-100">
                  <td className="py-1">{f.anio}</td><td>{u(f.ventas)}</td><td>{u(f.ebitda)}</td><td>{u(f.fcf)}</td><td>{u(f.vp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 6. Escenarios */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">6. Escenarios</h2>
        <p className="mt-1 text-sm text-slate-600">Toda estimación tiene incertidumbre; por eso damos un rango con tres escenarios.</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded border border-slate-200 p-3"><div className="text-xs text-slate-500">Conservador</div><div className="font-bold text-nexo">{u(esc.conservador)}</div></div>
          <div className="rounded border border-nexo bg-nexo-soft p-3"><div className="text-xs text-slate-500">Base</div><div className="font-bold text-nexo">{u(esc.base)}</div></div>
          <div className="rounded border border-slate-200 p-3"><div className="text-xs text-slate-500">Optimista</div><div className="font-bold text-nexo">{u(esc.optimista)}</div></div>
        </div>
      </section>

      {/* 7. Análisis NexoNegocios */}
      <section className="mt-6 pb">
        <h2 className="text-lg font-bold">7. Nuestro análisis</h2>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-semibold text-emerald-800">Fortalezas</div>
            <ul className="mt-2 space-y-1 text-xs text-emerald-900">
              {analisis.observaciones.filter((o) => o.tipo === "fortaleza").map((o, i) => <li key={i}>✓ {o.texto}</li>)}
              {analisis.observaciones.filter((o) => o.tipo === "fortaleza").length === 0 && <li>—</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">Puntos a mejorar</div>
            <ul className="mt-2 space-y-1 text-xs text-amber-900">
              {analisis.observaciones.filter((o) => o.tipo !== "fortaleza").map((o, i) => <li key={i}>• {o.texto}</li>)}
              {analisis.observaciones.filter((o) => o.tipo !== "fortaleza").length === 0 && <li>—</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Recomendaciones */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">8. Cómo aumentar el valor de tu empresa</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {analisis.recomendaciones.map((rc, i) => <li key={i}>{rc}</li>)}
        </ol>
      </section>

      {/* 9. Conclusión */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">9. Conclusión y precio sugerido</h2>
        <p className="mt-2 text-sm text-slate-600">
          Como orientación, el valor de tu empresa se ubica entre <strong>{u(r.rangoMinUsd)}</strong> y
          {" "}<strong>{u(r.rangoMaxUsd)}</strong>. Sugerimos usar este rango como referencia para tu
          precio de publicación; <strong>la decisión final del precio es tuya</strong>, y con ella el
          éxito de la venta.
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
          diligencia y las condiciones de mercado. Validez sujeta al contexto macro y al tipo de
          cambio vigentes a la fecha. Generado con motor versión {r.engineVersion}.
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

function PL({ k, v, nota, bold, hi }: { k: string; v: string; nota?: string; bold?: boolean; hi?: boolean }) {
  return (
    <tr className={"border-b border-slate-100 " + (hi ? "bg-nexo-soft" : "")}>
      <td className="py-1.5">
        <span className={bold ? "font-semibold text-slate-800" : "text-slate-600"}>{k}</span>
        {nota && <span className="block text-[10px] text-slate-400">{nota}</span>}
      </td>
      <td className={"py-1.5 text-right " + (bold ? "font-bold text-nexo" : "text-slate-700")}>{v}</td>
    </tr>
  );
}
