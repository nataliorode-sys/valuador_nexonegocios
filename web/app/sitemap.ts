import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { baseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  ];

  let fichas: MetadataRoute.Sitemap = [];
  try {
    const pubs = await prisma.publicacion.findMany({
      where: { estadoPub: "PUBLICADA", fechaVencimiento: { gt: new Date() } },
      select: { codigo: true, updatedAt: true },
      orderBy: { fechaPublicacion: "desc" },
      take: 5000,
    });
    fichas = pubs.map((p) => ({
      url: `${base}/empresa/${p.codigo}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    /* si la DB no está disponible, devolvemos al menos las estáticas */
  }

  return [...estaticas, ...fichas];
}
