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
  // En re-aprobaciones (edición) se conserva la fecha de publicación/vencimiento original,
  // para no reiniciar el reloj de 100 días con cada edición.
  const primeraVez = !pub.fechaPublicacion;

  await prisma.publicacion.update({
    where: { id: publicacionId },
    data: {
      estadoPub: "PUBLICADA",
      ...(primeraVez ? { fechaPublicacion: ahora, fechaVencimiento: vence } : {}),
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

// Dar de baja (reversible) una publicación desde moderación: la oculta de NexoDirecto
// conservando consultas, denuncias e historial. No reembolsa ni cambia la valuación.
export async function darDeBajaPublicacionAdmin(publicacionId: string): Promise<void> {
  await requireAdmin();
  await prisma.publicacion.update({ where: { id: publicacionId }, data: { estadoPub: "PAUSADA" } });
  revalidatePath("/admin/moderacion");
}

// Reactivar una publicación aprobada que está pausada (dada de baja) y sigue vigente.
export async function reactivarPublicacionAdmin(publicacionId: string): Promise<void> {
  await requireAdmin();
  const pub = await prisma.publicacion.findUnique({
    where: { id: publicacionId },
    select: { estadoPub: true, fechaVencimiento: true, valuacion: { select: { estado: true } } },
  });
  if (!pub) return;
  const vigente = !!pub.fechaVencimiento && pub.fechaVencimiento > new Date();
  if (pub.valuacion?.estado === "PUBLICADA" && pub.estadoPub === "PAUSADA" && vigente) {
    await prisma.publicacion.update({ where: { id: publicacionId }, data: { estadoPub: "PUBLICADA" } });
  }
  revalidatePath("/admin/moderacion");
}

// A1 — Rechazar: con motivo. Reembolsa el pago (A2-D).
export async function rechazarPublicacion(publicacionId: string, form: FormData): Promise<void> {
  await requireAdmin();
  const motivo = String(form.get("motivo") ?? "Contenido no apto para publicación");
  const pub = await prisma.publicacion.findUnique({ where: { id: publicacionId } });
  if (!pub) return;

  // Si ya estuvo publicada, esto es el rechazo de una EDICIÓN (no del alta inicial):
  // no se reembolsa (el servicio ya se prestó) ni se marca RECHAZADA.
  const esEdicion = !!pub.fechaPublicacion;

  // Defensa en profundidad: sacar la publicación de estado público.
  await prisma.publicacion.update({ where: { id: publicacionId }, data: { estadoPub: "PAUSADA" } });
  await prisma.moderacion.create({ data: { publicacionId, resultado: "RECHAZADA", motivo } });

  if (esEdicion) {
    // Vuelve a estado editable para que el dueño corrija los cambios y reenvíe.
    await prisma.valuacion.update({ where: { id: pub.valuacionId }, data: { estado: "PUBLICACION_EN_ARMADO" } });
    await notificarModeracion(pub.valuacionId, false, motivo).catch(() => {});
    revalidatePath("/admin/moderacion");
    return;
  }

  // Rechazo del alta inicial: marca RECHAZADA y reembolsa (A2-D).
  await prisma.valuacion.update({ where: { id: pub.valuacionId }, data: { estado: "RECHAZADA" } });
  const reembolsado = await reembolsar(pub.valuacionId);
  await notificarModeracion(pub.valuacionId, false, motivo).catch(() => {});
  revalidatePath("/admin/moderacion");
  if (!reembolsado) {
    console.error("[moderacion] Publicación rechazada pero el reembolso falló:", pub.valuacionId);
  }
}
