/**
 * Normalizacion de la entrada a USD (ancla del motor).
 * Ver docs/04-motor-valuacion.md §4.1: el motor razona en dolares reales.
 */
import type { EngineInput } from "./types.js";
import { nonNeg, num } from "./util.js";

/** Entrada normalizada: todos los montos en USD, anuales/stock segun corresponda. */
export interface NormalizedInput {
  familia: EngineInput["familia"];
  tcRef: number;
  antiguedadAnios: number;
  empleados: number;
  duenosTrabajan: number;

  ventas: number;
  concentracionClientePct: number;

  cogs: number;
  gastosFijos: number;

  retiroDuenos: number;
  sueldoMercadoDueno: number;
  gastosPersonales: number;
  extraordGasto: number;
  extraordIngreso: number;

  inventario: number;
  inventarioMinimo: number | null;
  porCobrar: number;
  porPagar: number;
  equipamiento: number;
  inmuebleIncluido: boolean;
  inmuebleValor: number;

  deudaFinanciera: number;
  deudaOtros: number;
  contingencias: number;
  deudaTransfiere: "quedan" | "transfieren";

  tendencia: EngineInput["tendencia"];
  crecimientoPct: number | null;
  dependenciaDueno: EngineInput["dependenciaDueno"];
  recurrencia: boolean;
}

export function normalize(input: EngineInput): NormalizedInput {
  // tcRef (ARS por USD) es SIEMPRE requerido: se usa para convertir a USD cuando la
  // carga es en ARS, y para mostrar el resultado en ARS en ambos casos.
  if (!Number.isFinite(input.tcRef) || input.tcRef <= 0) {
    throw new Error("tcRef invalido: se requiere un tipo de cambio (ARS por USD) > 0");
  }
  const tcReal = input.tcRef;
  const conv = input.monedaCarga === "ARS" ? tcReal : 1;
  const toUsd = (v: number | undefined | null): number => nonNeg(v) / conv;

  const ventas = toUsd(input.ventasAnual);
  const cogs =
    input.cogsModo === "pct"
      ? ventas * (clampPct(num(input.cogsPct)) / 100)
      : toUsd(input.cogsMonto);

  return {
    familia: input.familia,
    tcRef: tcReal,
    antiguedadAnios: nonNeg(input.antiguedadAnios),
    empleados: nonNeg(input.empleados),
    duenosTrabajan: nonNeg(input.duenosTrabajan),

    ventas,
    concentracionClientePct: clampPct(num(input.concentracionClientePct)),

    cogs,
    gastosFijos: toUsd(input.gastosFijosAnual),

    retiroDuenos: toUsd(input.retiroDuenosAnual),
    sueldoMercadoDueno: toUsd(input.sueldoMercadoDuenoAnual),
    gastosPersonales: toUsd(input.gastosPersonalesAnual),
    extraordGasto: toUsd(input.extraordGasto),
    extraordIngreso: toUsd(input.extraordIngreso),

    inventario: toUsd(input.inventario),
    inventarioMinimo: input.inventarioMinimo != null ? toUsd(input.inventarioMinimo) : null,
    porCobrar: toUsd(input.porCobrar),
    porPagar: toUsd(input.porPagar),
    equipamiento: toUsd(input.equipamiento),
    inmuebleIncluido: input.inmuebleIncluido === true,
    inmuebleValor: toUsd(input.inmuebleValor),

    deudaFinanciera: toUsd(input.deudaFinanciera),
    deudaOtros: toUsd(input.deudaOtros),
    contingencias: toUsd(input.contingencias),
    deudaTransfiere: input.deudaTransfiere ?? "quedan",

    tendencia: input.tendencia,
    crecimientoPct: input.crecimientoPct != null ? input.crecimientoPct : null,
    dependenciaDueno: input.dependenciaDueno,
    recurrencia: input.recurrencia === true,
  };
}

function clampPct(v: number): number {
  return Math.min(100, Math.max(0, v));
}
