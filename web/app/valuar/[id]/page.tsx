import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Wizard from "@/components/wizard/Wizard";
import { calcular, guardarPaso } from "../actions";
import type { FormData } from "@/lib/wizard/types";

export const dynamic = "force-dynamic";

export default async function WizardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valuacion = await prisma.valuacion.findUnique({
    where: { id },
    include: { perfil: true },
  });
  if (!valuacion || !valuacion.perfil) notFound();

  const datos = (valuacion.perfil.datos ?? {}) as FormData;
  return (
    <Wizard valuacionId={id} initialData={datos} guardarPaso={guardarPaso} calcular={calcular} />
  );
}
