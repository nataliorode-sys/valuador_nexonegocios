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
  /** true cuando se edita una publicación ya moderada: al guardar vuelve directo a revisión. */
  modoEdicion?: boolean;
}

export default function PublicarForm({ valuacionId, guardar, defaults, rangoMin, rangoMax, modoEdicion }: Props) {
  const [d, setD] = useState<PublicacionInput>(defaults);
  const [uploading, setUploading] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [declara, setDeclara] = useState(false);
  const [declaraError, setDeclaraError] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof PublicacionInput>(k: K, v: PublicacionInput[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const fueraDeRango =
    d.precioUsd > 0 && (d.precioUsd < rangoMin * 0.7 || d.precioUsd > rangoMax * 1.3);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setFotoError("");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo la imagen.");
      set("fotos", [...d.fotos, ...data.urls].slice(0, 6));
    } catch (err) {
      setFotoError(err instanceof Error ? err.message : "Error subiendo la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = () => {
    if (!declara) {
      setDeclaraError("Confirmá la declaración para continuar.");
      return;
    }
    setDeclaraError("");
    start(() => void guardar(valuacionId, d));
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
          <label className={label}>Fotos (hasta 6)</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {d.fotos.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-24 w-full rounded-lg object-cover" />
                <button type="button" onClick={() => set("fotos", d.fotos.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 leading-6 text-white">×</button>
              </div>
            ))}
            {d.fotos.length < 6 && (
              <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-400 hover:border-nexo">
                {uploading ? "Subiendo…" : "+ Foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onFiles} disabled={uploading} />
              </label>
            )}
          </div>
          {fotoError && <p className="mt-1 text-xs text-red-600">{fotoError}</p>}
          <p className="mt-1 text-xs text-slate-500">JPG, PNG o WebP, hasta 5 MB cada una.</p>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-medium text-slate-700">Contacto (se revela al comprador que consulta)</legend>
          <div className="space-y-3">
            <input className={inp} placeholder="Tu nombre" value={d.contactoNombre} onChange={(e) => set("contactoNombre", e.target.value)} />
            <input className={inp} placeholder="WhatsApp (ej: +54 9 351 …)" value={d.contactoWhatsapp} onChange={(e) => set("contactoWhatsapp", e.target.value)} />
            <input className={inp} placeholder="Email" value={d.contactoEmail} onChange={(e) => set("contactoEmail", e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <legend className="px-2 text-sm font-semibold text-emerald-800">Verificación de existencia</legend>
          <p className="text-sm text-slate-600">
            Para publicar con el sello <strong>“Empresa verificada por NexoNegocios”</strong>, chequeamos que tu
            negocio exista de verdad. <strong>Completá estos datos</strong> para que podamos verificarlo más rápido.
            <span className="text-slate-500"> No se muestran públicamente: los usa solo nuestro equipo de moderación.</span>
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className={label}>CUIT de la empresa</label>
              <input className={inp} placeholder="30-12345678-9" value={d.verifCuit} onChange={(e) => set("verifCuit", e.target.value)} />
            </div>
            <div>
              <label className={label}>Link a tu ficha de Google (Google Maps / Business)</label>
              <input className={inp} placeholder="https://maps.app.goo.gl/…" value={d.verifGoogleUrl} onChange={(e) => set("verifGoogleUrl", e.target.value)} />
            </div>
            <div>
              <label className={label}>Link a tus redes sociales (Instagram, Facebook…)</label>
              <input className={inp} placeholder="https://instagram.com/tunegocio" value={d.verifRedesUrl} onChange={(e) => set("verifRedesUrl", e.target.value)} />
            </div>
            <div>
              <label className={label}>Sitio web</label>
              <input className={inp} placeholder="https://tunegocio.com.ar" value={d.verifWebUrl} onChange={(e) => set("verifWebUrl", e.target.value)} />
            </div>
          </div>
        </fieldset>
      </div>

      <label className="mt-8 flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={declara} onChange={(e) => setDeclara(e.target.checked)} className="mt-1" />
        <span>
          Declaro que la información y las fotos son veraces y que tengo derecho a publicarlas, y acepto los{" "}
          <a href="/terminos" target="_blank" rel="noopener" className="text-nexo underline">Términos y Condiciones</a>.
        </span>
      </label>
      {declaraError && <p className="mt-2 text-sm text-red-600">{declaraError}</p>}

      {modoEdicion && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Al guardar, tus cambios pasan por moderación y tu publicación no se mostrará en el listado hasta que se aprueben.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={pending}
          className="rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Guardando…" : modoEdicion ? "Guardar y enviar a revisión →" : "Ver vista previa →"}
        </button>
      </div>
    </main>
  );
}
