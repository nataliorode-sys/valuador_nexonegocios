/**
 * Parametros por defecto del motor (version 1.0.0).
 *
 * IMPORTANTE: son valores de ARRANQUE, a CALIBRAR con datos reales de NexoNegocios
 * antes de produccion (ver docs/04-motor-valuacion.md §4.16). En produccion se cargan
 * desde la tabla ParametrosMotor (versionada) editable por admin.
 */
import type { EngineParams, Familia, FamiliaParams } from "./types.js";

const F = (
  min: number,
  base: number,
  max: number,
  margenTipico: number,
  wcPct: number,
  capexMantPct: number,
  assetHeavy = false,
): FamiliaParams => ({
  sde: { min, base, max },
  margenTipico,
  wcPct,
  capexMantPct,
  assetHeavy,
});

const familias: Record<Familia, FamiliaParams> = {
  //                     min  base  max   margen  wc    capex  assetHeavy
  servicios_profesionales: F(1.8, 2.4, 3.2, 0.35, 0.02, 0.01),
  gastronomia: F(1.2, 1.8, 2.5, 0.15, 0.03, 0.02),
  comercio_minorista: F(1.5, 2.0, 2.8, 0.12, 0.15, 0.01),
  mayorista_distribucion: F(2.0, 2.6, 3.5, 0.1, 0.2, 0.02),
  industria_manufactura: F(2.2, 3.0, 4.2, 0.15, 0.18, 0.03),
  salud_bienestar: F(2.0, 2.6, 3.5, 0.25, 0.05, 0.02),
  tecnologia_digital: F(3.0, 4.0, 6.0, 0.3, 0.05, 0.01),
  ecommerce: F(1.8, 2.4, 3.5, 0.12, 0.15, 0.02),
  logistica_transporte: F(2.0, 2.8, 4.0, 0.15, 0.05, 0.04, true),
  construccion: F(1.5, 2.2, 3.0, 0.15, 0.1, 0.02),
  educacion: F(2.0, 2.6, 3.5, 0.22, 0.02, 0.02),
  belleza_estetica_fitness: F(1.3, 1.9, 2.8, 0.2, 0.05, 0.02),
  agro: F(2.5, 3.0, 4.0, 0.2, 0.2, 0.04, true),
  turismo_hoteleria: F(2.0, 2.8, 4.0, 0.2, 0.05, 0.03, true),
  inmobiliario_rentas: F(2.0, 2.8, 4.0, 0.5, 0.02, 0.01, true),
  otros: F(1.5, 2.2, 3.0, 0.15, 0.1, 0.02),
};

export const DEFAULT_PARAMS: EngineParams = {
  version: "1.0.0",
  familias,

  umbralMicro: 150_000,
  umbralPequenia: 750_000,
  umbralMediana: 3_000_000,

  ebitdaMultiploOffset: 1.2,

  rLibreUSD: 0.045,
  primaPaisAR: 0.09,
  primaTamanio: {
    micro: 0.08,
    pequenia: 0.06,
    mediana: 0.045,
    grande: 0.03,
  },

  tEfectiva: 0.28,
  gTerminal: 0.025,
  aniosProyeccion: 5,

  gDefault: { crece: 0.05, estable: 0.0, baja: -0.05 },
  gMin: -0.1,
  gMax: 0.15,

  wMultiplos: 0.6,
  wDcf: 0.4,

  anchoBase: 0.1,
  anchoMax: 0.6,

  multiploFactorConservador: 0.85,
  multiploFactorOptimista: 1.15,
  gShiftEscenario: 0.05,
  rShiftEscenario: 0.03,
};
