"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { consumirPendiente } from "@/lib/valuaciones";

export async function ingresar(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Completá email y contraseña.";

  const user = await prisma.user.findUnique({ where: { email } });
  const target = user ? await consumirPendiente(user.id) : "/panel";

  try {
    await signIn("credentials", { email, password, redirectTo: target });
  } catch (e) {
    if (e instanceof AuthError) return "Email o contraseña incorrectos.";
    throw e; // NEXT_REDIRECT
  }
}
