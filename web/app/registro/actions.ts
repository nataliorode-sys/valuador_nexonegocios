"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { consumirPendiente } from "@/lib/valuaciones";
import { permitir, clientIp } from "@/lib/rateLimit";
import { VERSION_LEGAL } from "@/lib/legal";

export async function registrar(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const acepto = formData.get("acepto") === "on";

  const ip = await clientIp();
  if (!permitir(`registro:${ip}`, 6, 60 * 60_000)) return "Demasiados intentos. Probá de nuevo más tarde.";

  if (!email || !password) return "Completá email y contraseña.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "El email no es válido.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password !== password2) return "Las contraseñas no coinciden.";
  if (!acepto) return "Tenés que aceptar los Términos y la Política de Privacidad.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "Ya existe una cuenta con ese email.";

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      nombre: nombre || null,
      passwordHash,
      terminosAceptadosEn: new Date(),
      terminosVersion: VERSION_LEGAL,
    },
  });

  // Crea la valuación pendiente (si viene de la elegibilidad) y define el destino.
  const target = await consumirPendiente(user.id);

  try {
    await signIn("credentials", { email, password, redirectTo: target });
  } catch (e) {
    if (e instanceof AuthError) return "Cuenta creada, pero no se pudo iniciar sesión. Probá ingresar.";
    throw e; // NEXT_REDIRECT
  }
}
