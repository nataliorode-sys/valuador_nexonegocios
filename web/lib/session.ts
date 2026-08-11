// Sesion minima por cookie. Placeholder hasta integrar Auth.js (Fase 0 pendiente):
// crea un usuario "anonimo" para poder persistir el borrador y retomarlo.
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "nd_uid";

export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

/** Devuelve el userId de la cookie o crea un usuario y setea la cookie. Solo en Server Actions / Route Handlers. */
export async function ensureUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user.id;
  }
  const user = await prisma.user.create({ data: { email: `anon-${crypto.randomUUID()}@nexodirecto.local` } });
  store.set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return user.id;
}
