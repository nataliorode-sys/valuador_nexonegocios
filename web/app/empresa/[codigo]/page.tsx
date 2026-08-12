import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Ficha from "@/components/marketplace/Ficha";
import ContactForm from "@/components/marketplace/ContactForm";
import { familiaLabel } from "@/lib/publicacion";

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

// S3 — Ficha pública de la empresa.
export default async function EmpresaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const p = await prisma.publicacion.findUnique({ where: { codigo } });
  if (!p || p.estadoPub !== "PUBLICADA") notFound();

  // Contador de vistas (best-effort)
  await prisma.publicacion.update({ where: { id: p.id }, data: { vistas: { increment: 1 } } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/marketplace" className="text-sm text-slate-500 hover:text-nexo">← Volver al Marketplace</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Ficha p={p} />
        </div>
        <div className="md:pt-4">
          <ContactForm codigo={codigo} />
        </div>
      </div>
    </main>
  );
}
