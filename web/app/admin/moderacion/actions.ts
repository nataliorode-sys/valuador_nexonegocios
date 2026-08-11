"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const DIAS_PUBLICACION = 100;

// A1 — Aprobar: verifica existencia (checklist) y publica 100 días.
export async function aprobarPublicacion(publicacionId: string, form: FormData): Promise<void> {
  await requireAdmin();
  const checklist = {
    cuit: form.get("cuit") === "on",
    google: form.get("google") === "on",
    redes: form.get("redes") === "on",
    web: form.get("web") === "on",
  };
  const selloExistencia = Object.values(checklist).some(Boolean);

  const pub = await prisma.publicacion.findUnique({ where: { id: publicacionId } });
  if (!pub) return;

  const ahora = new Date();
  const vence = new Date(ahora.getTime() + DIAS_PUBLICACION * 86_400_000);

  await prisma.publicacion.update({
    where: { id: publicacionId },
    data: {
      estadoPub: "PUBLICADA",
      fechaPublicacion: ahora,
      fechaVencimiento: vence,
      selloExistencia,
      selloFuente: JSON.stringify(checklist),
    },
  });
  await prisma.valuacion.update({ where: { id: pub.valuacionId }, data: { estado: "PUBLICADA" } });
  await prisma.moderacion.create({
    data: { publicacionId, resultado: "APROBADA", checklistExistencia: checklist },
  });
  revalidatePath("/admin/moderacion");
}

// A1 — Rechazar: con motivo. Reembolsa el pago (A2-D).
export async function rechazarPublicacion(publicacionId: string, form: FormData): Promise<void> {
  await requireAdmin();
  const motivo = String(form.get("motivo") ?? "Contenido no apto para publicación");
  const pub = await prisma.publicacion.findUnique({ where: { id: publicacionId } });
  if (!pub) return;

  await prisma.valuacion.update({ where: { id: pub.valuacionId }, data: { estado: "RECHAZADA" } });
  await prisma.moderacion.create({ data: { publicacionId, resultado: "RECHAZADA", motivo } });
  // Reembolso (A2-D): evitar cliente insatisfecho.
  await prisma.pago.updateMany({ where: { valuacionId: pub.valuacionId }, data: { estado: "REEMBOLSADO" } });
  revalidatePath("/admin/moderacion");
}
