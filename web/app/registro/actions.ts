"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { consumirPendiente } from "@/lib/valuaciones";

export async function registrar(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!email || !password) return "Completá email y contraseña.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "El email no es válido.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password !== password2) return "Las contraseñas no coinciden.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "Ya existe una cuenta con ese email.";

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, nombre: nombre || null, passwordHash } });

  // Crea la valuación pendiente (si viene de la elegibilidad) y define el destino.
  const target = await consumirPendiente(user.id);

  try {
    await signIn("credentials", { email, password, redirectTo: target });
  } catch (e) {
    if (e instanceof AuthError) return "Cuenta creada, pero no se pudo iniciar sesión. Probá ingresar.";
    throw e; // NEXT_REDIRECT
  }
}
