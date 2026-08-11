/**
 * Flujo de fondos descontado simplificado (DCF). Ver docs/04-motor-valuacion.md §4.5, §4.8, §4.11.
 *
 * - Trabaja en USD reales.
 * - Valor terminal por MULTIPLO DE SALIDA (mas robusto que Gordon en PyME).
 * - Solo aplica si EBITDA normalizado > 0.
 */
import type { ClaseTamanio, EngineParams, FilaDcf } from "./types.js";
import type { NormalizedInput } from "./normalize.js";
import type { Earnings } from "./earnings.js";
import { clamp } from "./util.js";

export interface DcfResult {
  valor: number;
  tabla: FilaDcf[];
  tasa: number;
  gInicial: number;
}

/** Tasa de descuento real USD por build-up (§4.8). */
export function computeTasa(n: NormalizedInput, clase: ClaseTamanio, p: EngineParams): number {
  let primaEspecifica = 0;
  primaEspecifica +=
    n.dependenciaDueno === "alta" ? 0.03 : n.dependenciaDueno === "media" ? 0.015 : 0;
  primaEspecifica += n.concentracionClientePct > 50 ? 0.02 : n.concentracionClientePct > 30 ? 0.01 : 0;
  const r = p.rLibreUSD + p.primaPaisAR + p.primaTamanio[clase] + primaEspecifica;
  return Math.max(0.05, r);
}

/** Crecimiento real, con topes (§4.9). */
export function computeCrecimiento(n: NormalizedInput, p: EngineParams): number {
  const g = n.crecimientoPct != null ? n.crecimientoPct / 100 : p.gDefault[n.tendencia];
  return clamp(g, p.gMin, p.gMax);
}

/**
 * DCF con parametros de escenario (multiplo de salida, g y r vienen dados para
 * permitir reutilizar en escenarios). Devuelve null si no aplica (EBITDA<=0).
 */
export function computeDcf(
  n: NormalizedInput,
  e: Earnings,
  multiploSalida: number,
  g: number,
  r: number,
  p: EngineParams,
): DcfResult | null {
  if (e.ebitda <= 0 || n.ventas <= 0) return null;
  const rSafe = Math.max(0.05, r);
  const N = p.aniosProyeccion;
  const familia = p.familias[n.familia];

  const tabla: FilaDcf[] = [];
  let ventasPrev = n.ventas;
  let ventasT = n.ventas;
  let ebitdaT = e.ebitda;
  let valorFcf = 0;

  for (let t = 1; t <= N; t++) {
    // g_t hace fade lineal de g (año 1) a gTerminal (año N)
    const gT = N > 1 ? g + ((p.gTerminal - g) * (t - 1)) / (N - 1) : g;
    ventasT = ventasPrev * (1 + gT);
    ebitdaT = ebitdaT * (1 + gT);

    const capexMant = familia.capexMantPct * ventasT;
    const deltaWc = familia.wcPct * (ventasT - ventasPrev);
    const fcf = ebitdaT * (1 - p.tEfectiva) - capexMant - deltaWc;
    const vp = fcf / Math.pow(1 + rSafe, t);

    tabla.push({ anio: t, ventas: ventasT, ebitda: ebitdaT, fcf, vp });
    valorFcf += vp;
    ventasPrev = ventasT;
  }

  // Valor terminal por multiplo de salida sobre EBITDA del ultimo anio
  const ebitdaFinal = tabla[tabla.length - 1]!.ebitda;
  const tv = ebitdaFinal * multiploSalida;
  const vpTv = tv / Math.pow(1 + rSafe, N);

  return { valor: valorFcf + vpTv, tabla, tasa: rSafe, gInicial: g };
}
