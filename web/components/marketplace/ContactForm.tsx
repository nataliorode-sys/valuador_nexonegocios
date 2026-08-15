"use client";

import { useState, useTransition } from "react";
import { enviarContacto, type ContactoRevelado } from "@/app/empresa/[codigo]/actions";

export default function ContactForm({ codigo }: { codigo: string }) {
  const [d, setD] = useState({ nombre: "", email: "", telefono: "", mensaje: "", consentimiento: false });
  const [revelado, setRevelado] = useState<ContactoRevelado | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";
  const lab = "block text-sm font-medium text-slate-700";

  const submit = () => {
    setError("");
    if (!d.consentimiento) {
      setError("Necesitamos tu consentimiento para compartir tus datos con el vendedor.");
      return;
    }
    start(async () => {
      const res = await enviarContacto(codigo, d);
      if ("error" in res) setError(res.error);
      else setRevelado(res);
    });
  };

  if (revelado) {
    const wa = revelado.whatsapp?.replace(/[^\d]/g, "");
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="font-semibold text-emerald-800">¡Listo! Contactá al vendedor</div>
        <p className="mt-1 text-sm text-emerald-900">Le avisamos de tu consulta. También podés escribirle directo:</p>
        <div className="mt-3 space-y-1 text-sm">
          {revelado.nombre && <div>👤 {revelado.nombre}</div>}
          {revelado.whatsapp && (
            <div>📱 <a className="text-nexo underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener">{revelado.whatsapp}</a></div>
          )}
          {revelado.email && <div>✉️ <a className="text-nexo underline" href={`mailto:${revelado.email}`}>{revelado.email}</a></div>}
          {!revelado.whatsapp && !revelado.email && <div className="text-slate-500">El vendedor te contactará a partir de tus datos.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="font-semibold text-slate-800">Contactar al vendedor</div>
      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="c-nombre" className={lab}>Tu nombre *</label>
          <input id="c-nombre" className={inp} value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="c-email" className={lab}>Email</label>
            <input id="c-email" type="email" className={inp} value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="c-tel" className={lab}>Teléfono</label>
            <input id="c-tel" type="tel" className={inp} value={d.telefono} onChange={(e) => setD({ ...d, telefono: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="c-msg" className={lab}>Tu consulta</label>
          <textarea id="c-msg" className={inp} rows={3} value={d.mensaje} onChange={(e) => setD({ ...d, mensaje: e.target.value })} />
        </div>
        <label className="flex items-start gap-2 text-[12px] text-slate-600">
          <input type="checkbox" checked={d.consentimiento} onChange={(e) => setD({ ...d, consentimiento: e.target.checked })} className="mt-0.5" />
          <span>
            Acepto que mis datos se compartan con el vendedor para responder mi consulta, según la{" "}
            <a href="/privacidad" target="_blank" rel="noopener" className="text-nexo underline">Política de Privacidad</a>.
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={pending}
          className="w-full rounded-lg bg-nexo px-6 py-2.5 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Enviando…" : "Enviar consulta y ver contacto"}
        </button>
      </div>
    </div>
  );
}
