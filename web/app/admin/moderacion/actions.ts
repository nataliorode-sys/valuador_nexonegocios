"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { notificarModeracion } from "@/lib/notificaciones";
import { reembolsarPago } from "@/lib/mercadopago";

/**
 * Reintegra el pago del vendedor. Para pagos reales de MP ejecuta el refund vía API
 * y solo marca REEMBOLSADO si MP confirma; para pagos mock marca el estado local.
 * Devuelve true si quedó reembolsado, false si el refund real falló (queda APROBADO).
 */
async function reembolsar(valuacionId: string): Promise<boolean> {
  const pago = await prisma.pago.findUnique({ where: { valuacionId } });
  if (!pago || pago.estado !== "APROBADO") return true; // nada que reintegrar
  const esReal = pago.proveedor === "mercadopago" && !!pago.externalId && !pago.externalId.startsWith("mock-");
  if (esReal) {
    try {
      await reembolsarPago(pago.externalId as string);
    } catch (e) {
      console.error("[refund] MP no confirmó el reembolso", valuacionId, e);
      return false; // dejar APROBADO para reintento manual, no mentir con REEMBOLSADO
    }
  }
  await prisma.pago.update({ where: { valuacionId }, data: { estado: "REEMBOLSADO" } });
  return true;
}

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
  // Regla: la empresa se considera "verificada" con al menos 2 de 4 chequeos.
  const selloExistencia = Object.values(checklist).filter(Boolean).length >= 2;

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
  await notificarModeracion(pub.valuacionId, true).catch(() => {});
  revalidatePath("/admin/moderacion");
}

// A1 — Rechazar: con motivo. Reembolsa el pago (A2-D).
export async function rechazarPublicacion(publicacionId: string, form: FormData): Promise<void> {
  await requireAdmin();
  const motivo = String(form.get("motivo") ?? "Contenido no apto para publicación");
  const pub = await prisma.publicacion.findUnique({ where: { id: publicacionId } });
  if (!pub) return;

  await prisma.valuacion.update({ where: { id: pub.valuacionId }, data: { estado: "RECHAZADA" } });
  // Defensa en profundidad: sacar la publicación de estado público.
  await prisma.publicacion.update({ where: { id: publicacionId }, data: { estadoPub: "PAUSADA" } });
  await prisma.moderacion.create({ data: { publicacionId, resultado: "RECHAZADA", motivo } });
  // Reembolso real (A2-D): reintegra en MP; si falla, queda APROBADO para reintento manual.
  const reembolsado = await reembolsar(pub.valuacionId);
  await notificarModeracion(pub.valuacionId, false, motivo).catch(() => {});
  revalidatePath("/admin/moderacion");
  if (!reembolsado) {
    console.error("[moderacion] Publicación rechazada pero el reembolso falló:", pub.valuacionId);
  }
}
