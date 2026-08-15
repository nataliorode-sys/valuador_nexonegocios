// Utilidades de dominio para valuaciones (funciones normales, no server actions).
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { FormData } from "@/lib/wizard/types";

/** Crea la valuación + su perfil inicial. */
export async function crearValuacion(userId: string, datos: FormData): Promise<{ id: string }> {
  const seq = (await prisma.valuacion.count()) + 1;
  const codigo = `ND-2026-${String(seq).padStart(6, "0")}`;
  return prisma.valuacion.create({
    data: {
      codigo,
      userId,
      estado: "BORRADOR",
      perfil: { create: { familia: (datos.familia as string) ?? "otros", datos: datos as object } },
    },
    select: { id: true },
  });
}

const PRECIO_ARS = 150_000; // precio final (IVA incluido)
const IVA_ARS = Math.round(150_000 - 150_000 / 1.21); // IVA contenido

/** Marca la valuación como pagada (idempotente). Usada por webhook/retorno/mock. */
export async function marcarPagada(
  valuacionId: string,
  externalId: string,
  proveedor = "mercadopago",
  montoArs: number = PRECIO_ARS,
): Promise<void> {
  const [pagoActual, val] = await Promise.all([
    prisma.pago.findUnique({ where: { valuacionId }, select: { estado: true } }),
    prisma.valuacion.findUnique({ where: { id: valuacionId }, select: { estado: true } }),
  ]);

  // No revertir un reembolso ya realizado ante un reenvío tardío del webhook.
  if (pagoActual?.estado === "REEMBOLSADO") return;

  await prisma.pago.upsert({
    where: { valuacionId },
    create: { valuacionId, proveedor, estado: "APROBADO", montoArs, ivaArs: IVA_ARS, externalId },
    update: { estado: "APROBADO", externalId, proveedor, montoArs },
  });

  // Solo avanzar el estado si aún no fue procesada; nunca revertir PUBLICADA/EN_REVISION/etc.
  if (!val || val.estado === "BORRADOR" || val.estado === "CALCULADA") {
    await prisma.valuacion.update({ where: { id: valuacionId }, data: { estado: "PAGA" } });
  }
}

/**
 * Si hay una elegibilidad pendiente (cookie de S5), crea la valuación y devuelve
 * la ruta del wizard; si no, devuelve /panel. Se llama dentro de las acciones de auth.
 */
export async function consumirPendiente(userId: string): Promise<string> {
  const store = await cookies();
  const pending = store.get("nd_pending")?.value;
  if (!pending) return "/panel";
  store.delete("nd_pending");
  try {
    const datos = JSON.parse(pending) as FormData;
    const val = await crearValuacion(userId, datos);
    return `/valuar/${val.id}`;
  } catch {
    return "/valuar";
  }
}
