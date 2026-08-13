import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import Wizard from "@/components/wizard/Wizard";
import { calcular, guardarPaso } from "../actions";
import type { FormData } from "@/lib/wizard/types";

export const dynamic = "force-dynamic";

export default async function WizardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
  const valuacion = await prisma.valuacion.findUnique({
    where: { id },
    include: { perfil: true },
  });
  if (!valuacion || !valuacion.perfil) notFound();

  const datos = (valuacion.perfil.datos ?? {}) as FormData;
  const esEdicion = valuacion.estado !== "BORRADOR" && valuacion.estado !== "CALCULADA";
  return (
    <Wizard valuacionId={id} initialData={datos} guardarPaso={guardarPaso} calcular={calcular} esEdicion={esEdicion} />
  );
}
