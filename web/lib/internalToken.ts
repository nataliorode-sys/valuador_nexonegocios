// Token efímero firmado (HMAC) para que la generación interna del PDF (Chromium, sin
// cookie de sesión) pueda abrir la página del informe sin exponerla públicamente.
// El usuario final accede a /informe con sesión + propiedad; Chromium accede con este token.
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-cambiar";
const TTL_MS = 2 * 60 * 1000; // 2 minutos: suficiente para renderizar, corto para filtrarse

export function firmarTokenInterno(valuacionId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${valuacionId}.${exp}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verificarTokenInterno(valuacionId: string, token: string): boolean {
  try {
    const [id, expStr, sig] = Buffer.from(token, "base64url").toString().split(".");
    if (id !== valuacionId) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    const expected = crypto.createHmac("sha256", SECRET).update(`${id}.${exp}`).digest("hex");
    const a = Buffer.from(sig ?? "", "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
