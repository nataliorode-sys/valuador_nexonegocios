// Tipo de cambio de referencia en vivo (ARS por USD).
// Fuente por defecto: dólar MEP (el que se usa para operar/valuar empresas).
// Configurable con TC_FUENTE (bolsa=MEP, oficial=BNA, blue, mayorista).
// Cacheado 1 hora. Si la fuente falla: usa el último valor bueno conocido (en memoria)
// y, solo si nunca hubo uno, cae a TC_REF_DEFAULT. Siempre loguea el fallback.
const FUENTE = process.env.TC_FUENTE || "bolsa";
const FALLBACK = Number(process.env.TC_REF_DEFAULT || "1200");
const TIMEOUT_MS = 3500;

// Cache en memoria del último TC válido (sobrevive entre requests, no entre redeploys).
let ultimoTcBueno: number | null = null;

export async function obtenerTcRef(): Promise<number> {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${FUENTE}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
    const data = (await res.json()) as { venta?: number };
    const venta = Number(data?.venta);
    if (!Number.isFinite(venta) || venta <= 0) throw new Error("dolarapi: 'venta' inválida");
    ultimoTcBueno = Math.round(venta);
    return ultimoTcBueno;
  } catch (e) {
    const usado = ultimoTcBueno ?? FALLBACK;
    const origen = ultimoTcBueno != null ? "último valor bueno conocido" : "TC_REF_DEFAULT (posiblemente desactualizado)";
    console.warn(
      `[tc] No se pudo obtener el TC en vivo (fuente=${FUENTE}). Usando ${origen} = ${usado}. Detalle:`,
      e instanceof Error ? e.message : e,
    );
    return usado;
  }
}
