import type { EngineInput } from "../src/types.js";

/**
 * Input base valido: servicios profesionales, carga en USD, empresa pequenia y
 * rentable. Sirve de punto de partida para los tests (override lo que haga falta).
 */
export function makeInput(overrides: Partial<EngineInput> = {}): EngineInput {
  const base: EngineInput = {
    familia: "servicios_profesionales",
    antiguedadAnios: 8,
    empleados: 5,
    duenosTrabajan: 1,

    monedaCarga: "USD",
    tcRef: 1000, // ARS por USD (para display)

    ventasAnual: 300_000,
    anioRepresentativo: "normal",
    concentracionClientePct: 15,

    cogsModo: "pct",
    cogsPct: 20,
    gastosFijosAnual: 120_000,

    retiroDuenosAnual: 60_000,
    sueldoMercadoDuenoAnual: 40_000,
    gastosPersonalesAnual: 5_000,
    extraordGasto: 0,
    extraordIngreso: 0,

    inventario: 0,
    porCobrar: 20_000,
    porPagar: 10_000,
    equipamiento: 15_000,
    inmuebleIncluido: false,

    deudaFinanciera: 0,
    deudaOtros: 0,
    contingencias: 0,
    deudaTransfiere: "quedan",

    tendencia: "estable",
    dependenciaDueno: "media",
    recurrencia: false,
  };
  return { ...base, ...overrides };
}
