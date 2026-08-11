"use client";

import { useState, useTransition } from "react";
import { enviarContacto, type ContactoRevelado } from "@/app/empresa/[codigo]/actions";

export default function ContactForm({ codigo }: { codigo: string }) {
  const [d, setD] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [revelado, setRevelado] = useState<ContactoRevelado | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

  const submit = () => {
    setError("");
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
        <input className={inp} placeholder="Tu nombre *" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="Email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
          <input className={inp} placeholder="Teléfono" value={d.telefono} onChange={(e) => setD({ ...d, telefono: e.target.value })} />
        </div>
        <textarea className={inp} rows={3} placeholder="Tu consulta" value={d.mensaje} onChange={(e) => setD({ ...d, mensaje: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={pending}
          className="w-full rounded-lg bg-nexo px-6 py-2.5 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Enviando…" : "Enviar consulta y ver contacto"}
        </button>
        <p className="text-[11px] text-slate-400">
          Al enviar, tus datos quedan registrados para el vendedor y verás su WhatsApp/email para contacto directo.
        </p>
      </div>
    </div>
  );
}
