import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sugerirTitulo } from "@/lib/publicacion";
import PublicarForm from "@/components/publicar/PublicarForm";
import { guardarPublicacion } from "./actions";

export const dynamic = "force-dynamic";

// S10 — Armado de la publicación (post-pago).
export default async function PublicarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const val = await prisma.valuacion.findUnique({
    where: { id },
    include: { perfil: true, resultado: true, publicacion: true },
  });
  if (!val || !val.perfil || !val.resultado) notFound();
  if (val.estado === "BORRADOR" || val.estado === "CALCULADA") redirect(`/valuar/${id}/resultado`);

  const datos = (val.perfil.datos ?? {}) as Record<string, unknown>;
  const anioInicio = Number(datos.anioInicio ?? 0);
  const antiguedad = anioInicio > 0 ? 2026 - anioInicio : null;
  const tituloSugerido = sugerirTitulo(val.perfil.familia, datos.localidad as string, antiguedad);
  const pub = val.publicacion;

  return (
    <PublicarForm
      valuacionId={id}
      guardar={guardarPublicacion}
      defaults={{
        titulo: pub?.titulo ?? tituloSugerido,
        descripcion: pub?.descripcion ?? String(datos.actividadDesc ?? ""),
        precioUsd: pub?.precioPublicacion ?? val.resultado.valorCentralUsd,
        nivelPrivacidad: (pub?.nivelPrivacidad as "ANONIMA" | "IDENTIFICADA") ?? "ANONIMA",
        mostrarFacturacion: (pub?.configFinancieros as { mostrarFacturacion?: boolean } | null)?.mostrarFacturacion ?? true,
        fotos: pub?.fotos ?? [],
        contactoNombre: pub?.contactoNombre ?? "",
        contactoWhatsapp: pub?.contactoWhatsapp ?? "",
        contactoEmail: pub?.contactoEmail ?? "",
      }}
      rangoMin={val.resultado.rangoMinUsd}
      rangoMax={val.resultado.rangoMaxUsd}
    />
  );
}
