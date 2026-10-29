"use client";

import { useState } from "react";

// Galería de fotos de la publicación: imagen principal grande + miniaturas.
// Si no hay fotos, muestra la portada de marca (`fallback`, de /api/cover).
export default function Gallery({ fotos, titulo, fallback }: { fotos: string[]; titulo: string; fallback?: string }) {
  const [activa, setActiva] = useState(0);

  if (!fotos || fotos.length === 0) {
    if (fallback) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallback}
          alt={titulo}
          className="w-full rounded-2xl border border-nexo-border bg-slate-50 object-cover"
        />
      );
    }
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-nexo-border bg-slate-100 text-slate-400">
        Sin fotos
      </div>
    );
  }

  const principal = fotos[Math.min(activa, fotos.length - 1)];

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={principal}
        alt={titulo}
        className="h-auto max-h-[75vh] w-full rounded-2xl border border-nexo-border bg-slate-50 object-contain"
      />
      {fotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiva(i)}
              className={
                "h-16 w-20 flex-none overflow-hidden rounded-lg border-2 " +
                (i === activa ? "border-nexo" : "border-transparent opacity-70 hover:opacity-100")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
