import Link from "next/link";

// Stub del Marketplace (S2). Se implementa en la Fase 3 con datos reales,
// filtros y diferenciacion NexoDirecto vs Intermediada (ver docs/06-marketplace.md).
export default function MarketplacePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nexo">Empresas en venta</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-nexo">
          ← Volver
        </Link>
      </div>
      <p className="mt-4 text-slate-600">
        Próximamente: listado con filtros por rubro, ubicación y precio, con distinción entre
        publicaciones <strong>NexoDirecto</strong> (contacto directo) e{" "}
        <strong>Intermediadas por NexoNegocios</strong> (información verificada).
      </p>
      <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
        Sin publicaciones activas todavía (Fase 3).
      </div>
    </main>
  );
}
