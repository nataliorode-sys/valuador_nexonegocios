/**
 * Calculo de la base de ganancias normalizada.
 * Ver docs/04-motor-valuacion.md §4.2.
 *
 *   SDE   = Ventas - COGS - GastosFijos(sin duenios)
 *           + GastosPersonales + ExtraordGasto - ExtraordIngreso
 *   EBITDA = SDE - SueldoMercadoDueno
 */
import type { NormalizedInput } from "./normalize.js";

export interface Earnings {
  resultadoOperativoAntesDueno: number;
  sde: number;
  ebitda: number;
  margenSde: number; // SDE / ventas (0 si ventas<=0)
}

export function computeEarnings(n: NormalizedInput): Earnings {
  const resultadoOperativoAntesDueno = n.ventas - n.cogs - n.gastosFijos;
  const sde =
    resultadoOperativoAntesDueno + n.gastosPersonales + n.extraordGasto - n.extraordIngreso;
  const ebitda = sde - n.sueldoMercadoDueno;
  const margenSde = n.ventas > 0 ? sde / n.ventas : 0;
  return { resultadoOperativoAntesDueno, sde, ebitda, margenSde };
}
