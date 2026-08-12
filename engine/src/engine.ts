/**
 * Orquestador del motor de valuacion. Pipeline de docs/04-motor-valuacion.md §4.18.
 *
 * Determinístico: sin Date.now(), sin Math.random(). Mismos inputs + misma version
 * de parametros => mismo resultado.
 */
import type {
  Driver,
  EngineFlags,
  EngineInput,
  EngineParams,
  EngineResult,
  Escenarios,
  MetodoPredominante,
} from "./types.js";
import { DEFAULT_PARAMS } from "./params.js";
import { normalize, type NormalizedInput } from "./normalize.js";
import { computeEarnings, type Earnings } from "./earnings.js";
import { baseGananciaPara, clasificarTamanio } from "./size.js";
import { computeMultiple } from "./multiples.js";
import { computeCrecimiento, computeDcf, computeTasa } from "./dcf.js";
import { computeActivosNetos, deudaTransferida, excesoInventario } from "./assets.js";
import { clamp, roundTo } from "./util.js";

export interface Desglose {
  tcRef: number;
  ventas: number;
  cogs: number;
  gastosFijos: number;
  resultadoOperativo: number;
  gastosPersonales: number;
  extraordGasto: number;
  extraordIngreso: number;
  sde: number;
  sueldoMercadoDueno: number;
  ebitda: number;
  margenSde: number;
}

/** Desglose del P&L normalizado en USD (para el informe). Determinístico. */
export function desglosar(input: EngineInput, params: EngineParams = DEFAULT_PARAMS): Desglose {
  void params;
  const n = normalize(input);
  const e = computeEarnings(n);
  return {
    tcRef: n.tcRef,
    ventas: n.ventas,
    cogs: n.cogs,
    gastosFijos: n.gastosFijos,
    resultadoOperativo: e.resultadoOperativoAntesDueno,
    gastosPersonales: n.gastosPersonales,
    extraordGasto: n.extraordGasto,
    extraordIngreso: n.extraordIngreso,
    sde: e.sde,
    sueldoMercadoDueno: n.sueldoMercadoDueno,
    ebitda: e.ebitda,
    margenSde: e.margenSde,
  };
}

export function valuar(input: EngineInput, params: EngineParams = DEFAULT_PARAMS): EngineResult {
  const n = normalize(input);
  const e = computeEarnings(n);

  const clase = clasificarTamanio(n.ventas, params);
  const base = baseGananciaPara(clase);
  const baseGananciaUSD = base === "SDE" ? e.sde : e.ebitda;
  const noRentable = baseGananciaUSD <= 0;

  const mult = computeMultiple(n, e, clase, base, params);
  const gBase = computeCrecimiento(n, params);
  const rBase = computeTasa(n, clase, params);

  const familia = params.familias[n.familia];
  const inmueble = n.inmuebleIncluido ? n.inmuebleValor : 0;
  const excesoInv = excesoInventario(n, familia.wcPct);
  const activosNetos = computeActivosNetos(n);

  // Tabla DCF del escenario base (para el informe)
  const dcfBase = noRentable
    ? null
    : computeDcf(n, e, mult.multiploBase, gBase, rBase, params);
  const dcfAplicado = dcfBase !== null;

  // --- Funcion de valor por escenario ---
  const valorEscenario = (
    opMultiplo: number,
    exitMultiplo: number,
    g: number,
    r: number,
  ): number => {
    if (noRentable) return Math.max(0, activosNetos);
    const valorMult = baseGananciaUSD * opMultiplo;
    const dcf = computeDcf(n, e, exitMultiplo, g, r, params);
    let valorOperativo: number;
    if (dcf) {
      const wsum = params.wMultiplos + params.wDcf;
      valorOperativo = (params.wMultiplos * valorMult + params.wDcf * dcf.valor) / wsum;
    } else {
      valorOperativo = valorMult;
    }
    const valorGCparaDueno =
      valorOperativo + inmueble + excesoInv - deudaTransferida(n);
    // Piso por activos netos
    return Math.max(valorGCparaDueno, activosNetos, 0);
  };

  const { min, max } = mult.rango;
  const valorBase = valorEscenario(mult.multiploFinal, mult.multiploBase, gBase, rBase);
  const valorConservador = valorEscenario(
    clamp(mult.multiploFinal * params.multiploFactorConservador, min, max),
    clamp(mult.multiploBase * params.multiploFactorConservador, min, max),
    gBase - params.gShiftEscenario,
    rBase + params.rShiftEscenario,
  );
  const valorOptimista = valorEscenario(
    clamp(mult.multiploFinal * params.multiploFactorOptimista, min, max),
    clamp(mult.multiploBase * params.multiploFactorOptimista, min, max),
    gBase + params.gShiftEscenario,
    Math.max(0.05, rBase - params.rShiftEscenario),
  );

  // Valores de metodo (escenario base) para reporte
  const valorMultiplos = noRentable ? 0 : baseGananciaUSD * mult.multiploFinal;
  const valorDcf = dcfBase ? dcfBase.valor : null;

  // --- Incertidumbre: ensancha el rango (§4.13) ---
  const completitud = calcularCompletitud(input);
  const margenTipico = familia.margenTipico;
  const margenDev = margenTipico > 0 ? Math.abs(e.margenSde - margenTipico) / margenTipico : 0;
  const datosAtipicos = margenDev > 0.6 || e.margenSde < 0;

  const fCompletitud = 1 + (1 - completitud) * 0.8;
  const fAtipicidad = 1 + Math.min(0.6, margenDev) * 0.5;
  const fRiesgo =
    1 +
    (n.dependenciaDueno === "alta" ? 0.15 : n.dependenciaDueno === "media" ? 0.05 : 0) +
    (n.concentracionClientePct > 50 ? 0.15 : n.concentracionClientePct > 30 ? 0.08 : 0) +
    (clase === "grande" ? 0.15 : 0);
  const halfWidth = clamp(
    params.anchoBase * fCompletitud * fAtipicidad * fRiesgo,
    0,
    params.anchoMax,
  );

  const central = valorBase;
  const rangoMin = Math.max(
    0,
    Math.min(valorConservador, valorBase, valorOptimista, central * (1 - halfWidth)),
  );
  const rangoMax = Math.max(
    valorConservador,
    valorBase,
    valorOptimista,
    central * (1 + halfWidth),
  );

  // --- Metodo predominante ---
  const pisoActivosAplicado = !noRentable && central <= activosNetos + 1e-6 && activosNetos > 0;
  let metodo: MetodoPredominante;
  if (noRentable || pisoActivosAplicado) metodo = "activos";
  else if (dcfAplicado) metodo = "mixto";
  else metodo = "multiplos";

  // --- Drivers ---
  const drivers = construirDrivers(mult.ajustes, familia.assetHeavy, noRentable);

  // --- Redondeo de presentacion ---
  const rUsd = (v: number) => roundTo(v, 500);
  const rArs = (v: number) => roundTo(v * n.tcRef, 100_000);

  const escenariosUSD: Escenarios = {
    conservador: rUsd(valorConservador),
    base: rUsd(valorBase),
    optimista: rUsd(valorOptimista),
  };

  const flags: EngineFlags = {
    noRentable,
    assetHeavy: familia.assetHeavy,
    grande: clase === "grande",
    datosAtipicos,
    dcfAplicado,
    pisoActivosAplicado,
  };

  return {
    engineVersion: params.version,
    monedaResultado: "USD",
    tcRef: n.tcRef,

    sdeUSD: rUsd(e.sde),
    ebitdaUSD: rUsd(e.ebitda),
    margenSde: Number(e.margenSde.toFixed(4)),

    claseTamanio: clase,
    familia: n.familia,
    baseGanancia: base,
    baseGananciaUSD: rUsd(baseGananciaUSD),

    multiploFinal: Number(mult.multiploFinal.toFixed(3)),
    valorMultiplosUSD: rUsd(valorMultiplos),
    valorDcfUSD: valorDcf != null ? rUsd(valorDcf) : null,
    valorActivosUSD: rUsd(Math.max(0, activosNetos)),

    valorCentralUSD: rUsd(central),
    rangoMinUSD: rUsd(rangoMin),
    rangoMaxUSD: rUsd(rangoMax),

    valorCentralARS: rArs(central),
    rangoMinARS: rArs(rangoMin),
    rangoMaxARS: rArs(rangoMax),

    escenariosUSD,
    tablaDcf: dcfBase ? dcfBase.tabla : null,
    metodoPredominante: metodo,
    drivers,
    ajustesMultiplo: mult.ajustes,
    precisionPct: Math.round(50 + completitud * 50),
    flags,
  };
}

/** Completitud 0..1 segun campos opcionales presentes. */
function calcularCompletitud(input: EngineInput): number {
  const opcionales: Array<unknown> = [
    input.concentracionClientePct,
    input.gastosPersonalesAnual,
    input.extraordGasto,
    input.inventario,
    input.porCobrar,
    input.porPagar,
    input.equipamiento,
    input.deudaFinanciera,
    input.crecimientoPct,
    input.recurrencia,
    input.anioRepresentativo,
  ];
  const presentes = opcionales.filter((v) => v != null).length;
  return presentes / opcionales.length;
}

function construirDrivers(
  ajustes: { factor: string; delta: number }[],
  assetHeavy: boolean,
  noRentable: boolean,
): Driver[] {
  const etiquetas: Record<string, string> = {
    tamanio: "Tamanio de la empresa",
    crecimiento: "Perspectiva de crecimiento",
    dependencia_dueno: "Dependencia del duenio",
    recurrencia: "Ingresos recurrentes",
    concentracion_clientes: "Concentracion de clientes",
    antiguedad: "Antiguedad del negocio",
    margen_vs_rubro: "Margen vs. el rubro",
  };
  const drivers: Driver[] = ajustes
    .filter((a) => Math.abs(a.delta) >= 0.05)
    .map((a) => ({
      factor: etiquetas[a.factor] ?? a.factor,
      efecto: a.delta > 0 ? "sube" : a.delta < 0 ? "baja" : "neutro",
      detalle:
        (a.delta > 0 ? "Aumenta" : "Reduce") +
        " el valor (" +
        (a.delta > 0 ? "+" : "") +
        Math.round(a.delta * 100) +
        "% sobre el multiplo)",
    }));
  if (noRentable) {
    drivers.unshift({
      factor: "Rentabilidad",
      efecto: "baja",
      detalle: "El negocio hoy no muestra rentabilidad; el valor se acerca a sus activos.",
    });
  } else if (assetHeavy) {
    drivers.push({
      factor: "Activos del negocio",
      efecto: "neutro",
      detalle: "Rubro intensivo en activos: los bienes pesan en la valuacion.",
    });
  }
  return drivers;
}
