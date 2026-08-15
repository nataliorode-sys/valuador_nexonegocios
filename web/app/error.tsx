"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-4xl">😕</div>
      <h1 className="mt-4 text-2xl font-bold text-nexo">Algo salió mal</h1>
      <p className="mt-2 text-slate-600">
        Tuvimos un problema al procesar tu pedido. Tus datos están guardados. Probá de nuevo en
        unos segundos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="rounded-lg bg-nexo px-5 py-2.5 font-semibold text-white hover:bg-nexo-dark">
          Reintentar
        </button>
        <Link href="/panel" className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-600 hover:text-nexo">
          Ir a mi panel
        </Link>
      </div>
    </main>
  );
}
