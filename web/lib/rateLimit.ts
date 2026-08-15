// Rate limiting simple en memoria (ventana fija). Mitiga fuerza bruta y spam.
// Nota: es por instancia (no distribuido) y se reinicia con el proceso; suficiente
// para un despliegue de una sola instancia. Para escalar, migrar a Upstash/Redis.
import { headers } from "next/headers";

const store = new Map<string, { count: number; reset: number }>();

/** Devuelve true si la acción está permitida; false si superó el límite. */
export function permitir(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = store.get(key);
  if (!b || now > b.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    if (store.size > 5000) barrer(now); // limpieza oportunista
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

function barrer(now: number): void {
  for (const [k, v] of store) if (now > v.reset) store.delete(k);
}

/** IP del cliente a partir de los headers del proxy. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
