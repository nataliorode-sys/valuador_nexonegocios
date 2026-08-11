// Sesión basada en Auth.js (ver auth.ts).
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

export async function getRol(): Promise<string | null> {
  const s = await auth();
  return s?.user?.rol ?? null;
}

/** Redirige a login si no hay sesión. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/ingresar");
  return id;
}

/** Redirige si no es admin. */
export async function requireAdmin(): Promise<string> {
  const s = await auth();
  if (!s?.user?.id) redirect("/ingresar");
  if (s.user.rol !== "ADMIN") redirect("/");
  return s.user.id;
}
