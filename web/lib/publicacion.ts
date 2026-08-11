// Helpers para el auto-armado de la ficha del Marketplace (ver docs/06 §6.2).
import { FAMILIAS } from "@/lib/wizard/steps";

export function familiaLabel(familia: string): string {
  return FAMILIAS.find((f) => f.value === familia)?.label ?? "Empresa";
}

export function sugerirTitulo(familia: string, localidad?: string | null, antiguedad?: number | null): string {
  const base = familiaLabel(familia);
  const loc = localidad ? ` en ${localidad}` : "";
  const ant = antiguedad && antiguedad > 0 ? ` · ${antiguedad} años en marcha` : "";
  return `${base}${loc}${ant}`;
}

/** Banda de facturación pública redondeada (protege el número exacto). */
export function rangoFacturacion(ventasUsd: number): string | null {
  if (!Number.isFinite(ventasUsd) || ventasUsd <= 0) return null;
  const k = ventasUsd / 1000;
  const step = k < 300 ? 50 : k < 1000 ? 100 : 250;
  const lo = Math.floor(k / step) * step;
  const hi = lo + step;
  return `USD ${lo}k–${hi}k`;
}

interface PerfilDatos {
  recurrencia?: boolean;
  dependenciaDueno?: string;
  intangibles?: string[];
  incluyeVenta?: string[];
  local?: string;
  inmuebleIncluido?: boolean;
}

/** Chips automáticos a partir del perfil + flags del motor. */
export function buildHighlights(
  p: PerfilDatos,
  opts: { antiguedad?: number | null; noRentable: boolean },
): string[] {
  const h: string[] = [];
  if (opts.antiguedad && opts.antiguedad >= 3) h.push(`En marcha hace ${opts.antiguedad} años`);
  if (!opts.noRentable) h.push("Rentabilidad demostrada");
  if (p.recurrencia) h.push("Ingresos recurrentes");
  if (p.dependenciaDueno === "baja") h.push("Baja dependencia del dueño");
  if (p.intangibles?.includes("Marca registrada")) h.push("Incluye marca registrada");
  if (p.intangibles?.some((x) => x === "Página web" || x === "Redes sociales")) h.push("Incluye web y redes");
  if (p.local === "propio" && p.inmuebleIncluido) h.push("Local propio incluido");
  if (p.incluyeVenta?.includes("Stock")) h.push("Stock incluido");
  return h.slice(0, 6);
}
