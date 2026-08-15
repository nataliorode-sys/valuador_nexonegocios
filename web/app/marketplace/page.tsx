import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtUSD } from "@/lib/formato";
import { FAMILIAS } from "@/lib/wizard/steps";
import { familiaLabel } from "@/lib/publicacion";
import SiteHeader from "@/components/SiteHeader";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Empresas en venta",
  description:
    "Explorá empresas y fondos de comercio en venta en Argentina. Publicaciones NexoDirecto con contacto directo al vendedor e intermediadas por NexoNegocios.",
  alternates: { canonical: "/marketplace" },
};

// S2 — Marketplace público.
export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ familia?: string; provincia?: string; precioMax?: string }>;
}) {
  const sp = await searchParams;
  const where: Prisma.PublicacionWhereInput = {
    estadoPub: "PUBLICADA",
    fechaVencimiento: { gt: new Date() },
    valuacion: { estado: "PUBLICADA" }, // solo aprobadas por moderación
  };
  if (sp.familia) where.familia = sp.familia;
  if (sp.provincia) where.provincia = sp.provincia;
  if (sp.precioMax) where.precioPublicacion = { lte: Number(sp.precioMax) };

  const publicaciones = await prisma.publicacion.findMany({
    where,
    orderBy: { fechaPublicacion: "desc" },
    take: 60,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nexo">Empresas en venta</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-nexo">← Inicio</Link>
      </div>

      {/* Filtros */}
      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <select name="familia" defaultValue={sp.familia ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos los rubros</option>
          {FAMILIAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <input name="provincia" defaultValue={sp.provincia ?? ""} placeholder="Provincia"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="precioMax" type="number" defaultValue={sp.precioMax ?? ""} placeholder="Precio máx (USD)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-nexo px-4 py-2 text-sm font-medium text-white">Filtrar</button>
      </form>

      {publicaciones.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          No hay publicaciones que coincidan.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicaciones.map((p) => {
            const anon = p.nivelPrivacidad === "ANONIMA";
            const ubic = anon ? p.provincia ?? "—" : [p.localidad, p.provincia].filter(Boolean).join(", ");
            const highlights = Array.isArray(p.highlights) ? (p.highlights as string[]) : [];
            return (
              <Link key={p.id} href={`/empresa/${p.codigo}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
                {p.fotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.fotos[0]} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-slate-100 text-4xl">🏢</div>
                )}
                <div className="p-4">
                  <span className="rounded-full bg-nexo-accent/10 px-2 py-0.5 text-[10px] font-medium text-nexo-accent">NexoDirecto</span>
                  <h3 className="mt-2 font-semibold text-slate-900">{p.titulo}</h3>
                  <p className="text-xs text-slate-500">{familiaLabel(p.familia)} · {ubic}</p>
                  <div className="mt-2 text-lg font-bold text-nexo">{fmtUSD(p.precioPublicacion)}</div>
                  {highlights[0] && <p className="mt-1 text-xs text-slate-500">✓ {highlights[0]}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </main>
    </>
  );
}
