import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/marketplace/ContactForm";
import Gallery from "@/components/marketplace/Gallery";
import SiteHeader from "@/components/SiteHeader";
import { familiaLabel } from "@/lib/publicacion";
import { fmtUSD } from "@/lib/formato";
import { EMPRESA } from "@/lib/legal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  const p = await prisma.publicacion.findUnique({
    where: { codigo },
    select: { titulo: true, descripcion: true, estadoPub: true, valuacionId: true, familia: true, provincia: true },
  });
  if (!p || p.estadoPub !== "PUBLICADA") return { title: "Publicación no disponible" };

  const desc = `${familiaLabel(p.familia)} en venta${p.provincia ? ` · ${p.provincia}` : ""}. ${p.descripcion}`.slice(0, 200);
  const ogImage = `/api/flyer/${p.valuacionId}?f=post`;
  return {
    title: p.titulo,
    description: desc,
    alternates: { canonical: `/empresa/${codigo}` },
    openGraph: {
      title: p.titulo,
      description: desc,
      type: "website",
      images: [{ url: ogImage, width: 1080, height: 1080, alt: p.titulo }],
    },
    twitter: { card: "summary_large_image", title: p.titulo, description: desc, images: [ogImage] },
  };
}

// S3 — Ficha pública enriquecida de la empresa.
export default async function EmpresaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const p = await prisma.publicacion.findUnique({
    where: { codigo },
    include: { valuacion: { include: { perfil: true } } },
  });
  // La autoridad de moderación es valuacion.estado (solo "aprobar" la pone PUBLICADA).
  // Exigimos además vigencia. Esto impide ver por URL directa publicaciones en armado,
  // en revisión, rechazadas o vencidas.
  const vigente = !!p?.fechaVencimiento && p.fechaVencimiento > new Date();
  if (!p || p.estadoPub !== "PUBLICADA" || p.valuacion?.estado !== "PUBLICADA" || !vigente) notFound();

  // Contador de vistas (best-effort)
  await prisma.publicacion.update({ where: { id: p.id }, data: { vistas: { increment: 1 } } });

  const datos = (p.valuacion?.perfil?.datos ?? {}) as Record<string, unknown>;
  const anon = p.nivelPrivacidad === "ANONIMA";
  const ubicacion = anon ? p.provincia ?? "—" : [p.localidad, p.provincia].filter(Boolean).join(", ");
  const highlights = Array.isArray(p.highlights) ? (p.highlights as string[]) : [];
  const incluyeVenta = Array.isArray(datos.incluyeVenta) ? (datos.incluyeVenta as string[]) : [];
  const intangibles = Array.isArray(datos.intangibles) ? (datos.intangibles as string[]) : [];
  const empleados = typeof datos.empleados === "number" ? datos.empleados : null;
  const localTipo = datos.local === "propio" ? "Local propio" : datos.local === "alquilado" ? "Local alquilado" : null;

  const stats: { k: string; v: string }[] = [
    { k: "Rubro", v: familiaLabel(p.familia) },
    { k: "Ubicación", v: ubicacion },
  ];
  if (p.antiguedad) stats.push({ k: "Antigüedad", v: `${p.antiguedad} años` });
  if (empleados != null) stats.push({ k: "Empleados", v: String(empleados) });
  if (localTipo) stats.push({ k: "Instalaciones", v: localTipo });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/marketplace" className="text-sm text-slate-500 hover:text-nexo">← Volver a empresas en venta</Link>

        {/* Encabezado */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-nexo-accent/10 px-2.5 py-1 text-xs font-medium text-nexo-accent">
            NexoDirecto · contacto directo
          </span>
          {p.selloExistencia && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              🛡 Empresa verificada por NexoNegocios
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold text-nexo">{p.titulo}</h1>
        <p className="mt-1 text-slate-500">{familiaLabel(p.familia)} · {ubicacion}{p.antiguedad ? ` · ${p.antiguedad} años` : ""}</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Columna principal */}
          <div>
            <Gallery fotos={p.fotos} titulo={p.titulo} />

            {/* Precio + facturación */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-nexo-border bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-slate-400">Precio de venta</div>
                <div className="mt-1 text-2xl font-bold text-nexo">{fmtUSD(p.precioPublicacion)}</div>
              </div>
              {p.facturacionPublica && (
                <div className="rounded-xl border border-nexo-border bg-white p-5">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Facturación anual</div>
                  <div className="mt-1 text-2xl font-bold text-slate-700">{p.facturacionPublica}</div>
                </div>
              )}
            </div>

            {/* Lo más destacado */}
            {highlights.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-slate-900">Lo más destacado</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-nexo-border bg-white px-3 py-2.5 text-sm text-slate-700">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none text-nexo-accent" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Descripción */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Sobre esta empresa</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{p.descripcion}</p>
            </section>

            {/* Qué incluye la venta */}
            {incluyeVenta.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-slate-900">Qué incluye la venta</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {incluyeVenta.map((x) => (
                    <span key={x} className="rounded-full border border-nexo-border bg-white px-3 py-1.5 text-sm text-slate-600">{x}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Intangibles */}
            {intangibles.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">Activos intangibles</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {intangibles.map((x) => (
                    <span key={x} className="rounded-full bg-nexo-soft px-3 py-1 text-xs text-nexo">{x}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Datos de la operación */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Datos de la operación</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.k} className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <dt className="text-xs text-slate-400">{s.k}</dt>
                    <dd className="text-sm font-medium text-slate-700">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Confianza / verificación */}
            {p.selloExistencia && (
              <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  🛡 Empresa verificada por NexoNegocios
                </div>
                <p className="mt-1 text-sm text-emerald-900">
                  Chequeamos que este negocio existe realmente (CUIT, presencia online y/o local).
                  La información comercial la aporta el propietario.
                </p>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-400">
              La información comercial fue provista por el propietario. NexoNegocios verifica la existencia
              del negocio, no sus números. No constituye una tasación ni asesoramiento.{" "}
              <a
                href={`mailto:${EMPRESA.email}?subject=Reporte%20de%20publicaci%C3%B3n%20${p.codigo}`}
                className="underline hover:text-nexo"
              >
                Reportar esta publicación
              </a>.
            </p>
          </div>

          {/* Columna de contacto (sticky en desktop) */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ContactForm codigo={codigo} />
            <div className="mt-4 rounded-xl border border-nexo-border bg-white p-4 text-xs text-slate-500">
              <div className="font-semibold text-slate-700">¿Por qué NexoDirecto?</div>
              <ul className="mt-2 space-y-1">
                <li>• Contacto directo con el dueño, sin intermediarios.</li>
                <li>• Valuación con método profesional de NexoNegocios.</li>
                <li>• Publicación con existencia verificada.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
