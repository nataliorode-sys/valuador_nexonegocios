"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { enviarEmail, layout } from "@/lib/email";
import { baseUrl } from "@/lib/seo";
import { permitir, clientIp } from "@/lib/rateLimit";

/**
 * Pide el restablecimiento: genera un token, guarda su hash con vencimiento (1h) y
 * manda el email con el link. Siempre responde igual (no revela si el email existe).
 */
export async function pedirReset(_prev: string | undefined, formData: FormData): Promise<string> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const OK = "Si el email está registrado, te enviamos un enlace para restablecer tu contraseña. Revisá tu casilla (y el spam).";

  if (!email) return "Ingresá tu email.";
  const ip = await clientIp();
  if (!permitir(`reset:${ip}`, 5, 15 * 60_000)) return "Demasiados intentos. Esperá unos minutos.";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return OK; // no revelar existencia

  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hash, resetTokenExp: new Date(Date.now() + 60 * 60_000) },
  });

  const base = process.env.APP_BASE_URL ? baseUrl() : "";
  const url = `${base}/restablecer?uid=${user.id}&token=${token}`;
  await enviarEmail({
    to: email,
    subject: "Restablecé tu contraseña · NexoDirecto",
    html: layout("Restablecé tu contraseña", `
      <p>Recibimos un pedido para restablecer la contraseña de tu cuenta.</p>
      <p><a href="${url}" style="display:inline-block;background:#15314D;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">Crear nueva contraseña</a></p>
      <p style="color:#607083;font-size:13px">El enlace vence en 1 hora. Si no fuiste vos, ignorá este correo.</p>
      <p style="color:#607083;font-size:12px;word-break:break-all">${url}</p>`),
  }).catch(() => {});

  return OK;
}
