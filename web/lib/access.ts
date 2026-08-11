// Control de propiedad: garantiza que la valuación pertenece al usuario logueado.
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

/** Verifica que el usuario logueado es dueño de la valuación. Devuelve el userId. */
export async function assertOwner(valuacionId: string): Promise<string> {
  const uid = await requireUserId();
  const v = await prisma.valuacion.findUnique({ where: { id: valuacionId }, select: { userId: true } });
  if (!v || v.userId !== uid) notFound();
  return uid;
}
