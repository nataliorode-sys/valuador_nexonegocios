import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sugerirTitulo } from "@/lib/publicacion";
import { assertOwner } from "@/lib/access";
import PublicarForm from "@/components/publicar/PublicarForm";
import FunnelHeader from "@/components/FunnelHeader";
import { guardarPublicacion } from "./actions";

export const dynamic = "force-dynamic";

// S10 — Armado de la publicación (post-pago).
export default async function PublicarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
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
  const verif = (pub?.datosVerificacion as { cuit?: string; googleUrl?: string; redesUrl?: string; webUrl?: string } | null) ?? null;

  return (
    <>
    <FunnelHeader />
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
        verifCuit: verif?.cuit ?? "",
        verifGoogleUrl: verif?.googleUrl ?? "",
        verifRedesUrl: verif?.redesUrl ?? "",
        verifWebUrl: verif?.webUrl ?? "",
      }}
      rangoMin={val.resultado.rangoMinUsd}
      rangoMax={val.resultado.rangoMaxUsd}
      modoEdicion={!!pub?.fechaPublicacion}
    />
    </>
  );
}
