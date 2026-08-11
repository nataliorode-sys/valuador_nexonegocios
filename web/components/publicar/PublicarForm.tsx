"use client";

import { useState, useTransition } from "react";
import { fmtUSD } from "@/lib/formato";
import type { PublicacionInput } from "@/app/valuar/[id]/publicar/actions";

interface Props {
  valuacionId: string;
  guardar: (valuacionId: string, data: PublicacionInput) => Promise<void>;
  defaults: PublicacionInput & { fotos: string[] };
  rangoMin: number;
  rangoMax: number;
}

export default function PublicarForm({ valuacionId, guardar, defaults, rangoMin, rangoMax }: Props) {
  const [d, setD] = useState<PublicacionInput>(defaults);
  const [fotosText, setFotosText] = useState(defaults.fotos.join("\n"));
  const [pending, start] = useTransition();

  const set = <K extends keyof PublicacionInput>(k: K, v: PublicacionInput[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const fueraDeRango =
    d.precioUsd > 0 && (d.precioUsd < rangoMin * 0.7 || d.precioUsd > rangoMax * 1.3);

  const submit = () => {
    const fotos = fotosText.split("\n").map((s) => s.trim()).filter(Boolean);
    start(() => void guardar(valuacionId, { ...d, fotos }));
  };

  const label = "block text-sm font-medium text-slate-700";
  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-nexo">Armá tu publicación</h1>
      <p className="mt-1 text-slate-600">Precargamos todo con tus datos. Revisá y ajustá lo que quieras.</p>

      <div className="mt-8 space-y-6">
        <div>
          <label className={label}>Título del aviso</label>
          <input className={inp} value={d.titulo} onChange={(e) => set("titulo", e.target.value)} />
        </div>

        <div>
          <label className={label}>Descripción</label>
          <textarea className={inp} rows={4} value={d.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
        </div>

        <div>
          <label className={label}>Precio de venta (USD) — vos decidís</label>
          <input type="number" className={inp} value={d.precioUsd || ""} onChange={(e) => set("precioUsd", Number(e.target.value))} />
          <p className="mt-1 text-xs text-slate-500">Orientación NexoDirecto: {fmtUSD(rangoMin)} – {fmtUSD(rangoMax)}</p>
          {fueraDeRango && (
            <p className="mt-1 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠️ Tu precio está bastante lejos de la orientación. Es tu decisión, pero puede afectar el interés de los compradores.
            </p>
          )}
        </div>

        <div>
          <label className={label}>¿Cómo querés publicar?</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { v: "ANONIMA", t: "Anónima", d: "Sin nombre ni dirección. Protege tu negocio." },
              { v: "IDENTIFICADA", t: "Identificada", d: "Con todos los datos. Recibe más consultas." },
            ].map((o) => (
              <button key={o.v} type="button" onClick={() => set("nivelPrivacidad", o.v as "ANONIMA" | "IDENTIFICADA")}
                className={"rounded-xl border p-3 text-left " + (d.nivelPrivacidad === o.v ? "border-nexo bg-nexo-soft" : "border-slate-200")}>
                <div className="font-medium text-slate-800">{o.t}</div>
                <div className="text-xs text-slate-500">{o.d}</div>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={d.mostrarFacturacion} onChange={(e) => set("mostrarFacturacion", e.target.checked)} />
          Mostrar mi facturación como rango (recomendado)
        </label>

        <div>
          <label className={label}>Fotos (una URL por línea, opcional)</label>
          <textarea className={inp} rows={3} placeholder="https://…" value={fotosText} onChange={(e) => setFotosText(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">Pocas fotos (3–6). La carga de archivos se habilita más adelante.</p>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-medium text-slate-700">Contacto (se revela al comprador que consulta)</legend>
          <div className="space-y-3">
            <input className={inp} placeholder="Tu nombre" value={d.contactoNombre} onChange={(e) => set("contactoNombre", e.target.value)} />
            <input className={inp} placeholder="WhatsApp (ej: +54 9 351 …)" value={d.contactoWhatsapp} onChange={(e) => set("contactoWhatsapp", e.target.value)} />
            <input className={inp} placeholder="Email" value={d.contactoEmail} onChange={(e) => set("contactoEmail", e.target.value)} />
          </div>
        </fieldset>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={submit} disabled={pending}
          className="rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Guardando…" : "Ver vista previa →"}
        </button>
      </div>
    </main>
  );
}
