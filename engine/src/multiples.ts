/**
 * Metodo de multiplos (primario). Ver docs/04-motor-valuacion.md §4.4.
 *
 *   Multiplo_final = clamp( base * (1 + Σ ajustes), min, max )
 *   Valor_operativo = Base_ganancia * Multiplo_final   (going concern)
 */
import type {
  AjusteMultiplo,
  BaseGanancia,
  ClaseTamanio,
  EngineParams,
  MultiploRango,
} from "./types.js";
import type { NormalizedInput } from "./normalize.js";
import type { Earnings } from "./earnings.js";
import { clamp } from "./util.js";

export interface MultipleResult {
  rango: MultiploRango;
  multiploBase: number;
  multiploFinal: number;
  ajustes: AjusteMultiplo[];
}

/** Rango de multiplo segun base (SDE directo; EBITDA = SDE + offset). */
export function rangoMultiplo(
  familia: NormalizedInput["familia"],
  base: BaseGanancia,
  p: EngineParams,
): MultiploRango {
  const sde = p.familias[familia].sde;
  if (base === "SDE") return { ...sde };
  const off = p.ebitdaMultiploOffset;
  return { min: sde.min + off, base: sde.base + off, max: sde.max + off };
}

export function computeMultiple(
  n: NormalizedInput,
  e: Earnings,
  clase: ClaseTamanio,
  base: BaseGanancia,
  p: EngineParams,
): MultipleResult {
  const rango = rangoMultiplo(n.familia, base, p);
  const ajustes: AjusteMultiplo[] = [];

  // Tamanio: mas grande => multiplo mayor
  const tamanioDelta: Record<ClaseTamanio, number> = {
    micro: 0,
    pequenia: 0.05,
    mediana: 0.12,
    grande: 0.18,
  };
  ajustes.push({ factor: "tamanio", delta: tamanioDelta[clase] });

  // Crecimiento
  let crecDelta: number;
  if (n.crecimientoPct != null) {
    crecDelta = clamp((n.crecimientoPct / 100) * 1.0, -0.2, 0.2);
  } else {
    crecDelta = n.tendencia === "crece" ? 0.1 : n.tendencia === "baja" ? -0.15 : 0;
  }
  ajustes.push({ factor: "crecimiento", delta: crecDelta });

  // Dependencia del duenio
  const depDelta = n.dependenciaDueno === "baja" ? 0.1 : n.dependenciaDueno === "alta" ? -0.2 : 0;
  ajustes.push({ factor: "dependencia_dueno", delta: depDelta });

  // Recurrencia de ingresos
  ajustes.push({ factor: "recurrencia", delta: n.recurrencia ? 0.1 : 0 });

  // Concentracion de clientes
  const conc = n.concentracionClientePct;
  const concDelta = conc > 50 ? -0.2 : conc > 30 ? -0.1 : 0;
  ajustes.push({ factor: "concentracion_clientes", delta: concDelta });

  // Antiguedad
  const ant = n.antiguedadAnios;
  const antDelta = ant >= 10 ? 0.1 : ant >= 5 ? 0.05 : ant >= 3 ? 0 : -0.05;
  ajustes.push({ factor: "antiguedad", delta: antDelta });

  // Margen vs tipico del rubro
  const margenTipico = p.familias[n.familia].margenTipico;
  let margenDelta = 0;
  if (margenTipico > 0) {
    margenDelta = clamp(((e.margenSde - margenTipico) / margenTipico) * 0.3, -0.15, 0.15);
  }
  ajustes.push({ factor: "margen_vs_rubro", delta: margenDelta });

  const sumaDeltas = clamp(
    ajustes.reduce((acc, a) => acc + a.delta, 0),
    -0.5,
    0.6,
  );
  const multiploFinal = clamp(rango.base * (1 + sumaDeltas), rango.min, rango.max);

  return { rango, multiploBase: rango.base, multiploFinal, ajustes };
}
