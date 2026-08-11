/** Utilidades puras del motor. Sin efectos, sin aleatoriedad, sin fechas. */

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

/** Redondea a un multiplo (ej: 500) para presentacion. */
export function roundTo(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/** Anualiza un monto segun periodo. Util para la capa de formulario. */
export function annualize(value: number, period: "mensual" | "anual"): number {
  return period === "mensual" ? value * 12 : value;
}

/** Numero finito y no-negativo, o 0. Guarda anti-error para inputs opcionales. */
export function nonNeg(value: number | undefined | null): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return value;
}

/** Numero finito o fallback. */
export function num(value: number | undefined | null, fallback = 0): number {
  return value != null && Number.isFinite(value) ? value : fallback;
}
