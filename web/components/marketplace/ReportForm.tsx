"use client";

import { useState, useTransition } from "react";
import { reportarPublicacion } from "@/app/empresa/[codigo]/actions";

// Reporte de una publicación (denuncia). Desplegable discreto en la ficha.
export default function ReportForm({ codigo }: { codigo: string }) {
  const [motivo, setMotivo] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "ok" | string>("idle");
  const [pending, start] = useTransition();

  const enviar = () => {
    start(async () => {
      const res = await reportarPublicacion(codigo, motivo, email);
      if ("ok" in res) setEstado("ok");
      else setEstado(res.error);
    });
  };

  if (estado === "ok") {
    return <span className="text-xs text-slate-400">Gracias, recibimos tu reporte.</span>;
  }

  return (
    <details className="inline">
      <summary className="cursor-pointer list-none text-xs text-slate-400 underline hover:text-nexo">
        Reportar esta publicación
      </summary>
      <div className="mt-2 max-w-sm rounded-lg border border-slate-200 bg-white p-3 text-left">
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="¿Por qué la reportás? (contenido falso, engañoso, etc.)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Tu email (opcional, por si necesitamos más datos)"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {typeof estado === "string" && estado !== "idle" && (
          <p className="mt-1 text-xs text-red-600">{estado}</p>
        )}
        <button
          onClick={enviar}
          disabled={pending}
          className="mt-2 rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar reporte"}
        </button>
      </div>
    </details>
  );
}
