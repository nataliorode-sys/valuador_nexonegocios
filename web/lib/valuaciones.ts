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
