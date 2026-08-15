// Resolucion del ejecutable de Chromium para playwright-core (PDF y flyer).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Argumentos de launch seguros para contenedores (evita crash por /dev/shm chico).
export const CHROMIUM_ARGS = ["--disable-dev-shm-usage", "--no-sandbox"];

// Semáforo de concurrencia: limita cuántos Chromium corren a la vez para no agotar
// la memoria del contenedor (cada navegador consume mucho).
const MAX = Number(process.env.CHROMIUM_MAX || "2");
let activos = 0;
const cola: Array<() => void> = [];

/** Adquiere un slot; devuelve la función para liberarlo (llamar en finally). */
export async function adquirirSlotChromium(): Promise<() => void> {
  if (activos >= MAX) await new Promise<void>((resolve) => cola.push(resolve));
  activos++;
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    activos--;
    cola.shift()?.();
  };
}

/**
 * Origen interno para que Chromium (mismo contenedor) acceda a la app por HTTP
 * plano, sin pasar por el proxy público (evita ERR_SSL_PROTOCOL_ERROR).
 */
export function internalOrigin(): string {
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

export function resolveChromium(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH && existsSync(process.env.PLAYWRIGHT_CHROMIUM_PATH)) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const baseDir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    const dir = readdirSync(baseDir).find((d) => /^chromium-\d+$/.test(d));
    if (dir) {
      const exe = join(baseDir, dir, "chrome-linux", "chrome");
      if (existsSync(exe)) return exe;
    }
  } catch {
    /* baseDir inexistente */
  }
  return undefined;
}
