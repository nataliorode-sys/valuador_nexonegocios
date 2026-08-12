// Tipo de cambio de referencia en vivo (ARS por USD).
// Fuente por defecto: dólar MEP (el que se usa para operar/valuar empresas).
// Configurable con TC_FUENTE (bolsa=MEP, oficial=BNA, blue, mayorista).
// Cacheado 1 hora; si la fuente falla, usa TC_REF_DEFAULT.
const FUENTE = process.env.TC_FUENTE || "bolsa";
const FALLBACK = Number(process.env.TC_REF_DEFAULT || "1200");

export async function obtenerTcRef(): Promise<number> {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${FUENTE}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { venta?: number };
    const venta = Number(data?.venta);
    return Number.isFinite(venta) && venta > 0 ? Math.round(venta) : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
