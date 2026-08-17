"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** Valida el token y setea la nueva contraseña. */
export async function restablecer(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const uid = String(formData.get("uid") ?? "");
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!uid || !token) return "El enlace no es válido.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password !== password2) return "Las contraseñas no coinciden.";

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || !user.resetTokenHash || !user.resetTokenExp || user.resetTokenExp < new Date()) {
    return "El enlace es inválido o venció. Pedí uno nuevo.";
  }
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(user.resetTokenHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return "El enlace es inválido o venció. Pedí uno nuevo.";
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: uid },
    data: { passwordHash, resetTokenHash: null, resetTokenExp: null },
  });
  return "OK";
}
