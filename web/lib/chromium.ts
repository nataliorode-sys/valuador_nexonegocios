// Resolucion del ejecutable de Chromium para playwright-core (PDF y flyer).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
