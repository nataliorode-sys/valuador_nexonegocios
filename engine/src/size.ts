/**
 * Clasificacion por tamanio y eleccion de la base de ganancia.
 * Ver docs/04-motor-valuacion.md §4.3.
 */
import type { BaseGanancia, ClaseTamanio, EngineParams } from "./types.js";

export function clasificarTamanio(ventasUSD: number, p: EngineParams): ClaseTamanio {
  if (ventasUSD < p.umbralMicro) return "micro";
  if (ventasUSD < p.umbralPequenia) return "pequenia";
  if (ventasUSD < p.umbralMediana) return "mediana";
  return "grande";
}

/** Micro/Pequenia => SDE ; Mediana/Grande => EBITDA. */
export function baseGananciaPara(clase: ClaseTamanio): BaseGanancia {
  return clase === "micro" || clase === "pequenia" ? "SDE" : "EBITDA";
}
