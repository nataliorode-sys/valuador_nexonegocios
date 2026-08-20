// Control de propiedad: garantiza que la valuación pertenece al usuario logueado.
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId, getRol } from "@/lib/session";

/** Verifica que el usuario logueado es dueño de la valuación. Devuelve el userId. */
export async function assertOwner(valuacionId: string): Promise<string> {
  const uid = await requireUserId();
  const v = await prisma.valuacion.findUnique({ where: { id: valuacionId }, select: { userId: true } });
  if (!v || v.userId !== uid) notFound();
  return uid;
}

/**
 * Permite el acceso al dueño de la valuación O a un ADMIN (moderador).
 * Devuelve { admin } para que el llamador pueda, por ejemplo, saltear el gate
 * de pago cuando quien mira es un moderador inspeccionando una valuación ajena.
 */
export async function assertOwnerOrAdmin(valuacionId: string): Promise<{ admin: boolean }> {
  const uid = await requireUserId();
  const v = await prisma.valuacion.findUnique({ where: { id: valuacionId }, select: { userId: true } });
  if (!v) notFound();
  const admin = (await getRol()) === "ADMIN";
  if (v.userId === uid || admin) return { admin };
  notFound();
}
