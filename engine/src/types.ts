/**
 * Tipos del motor de valuacion NexoDirecto.
 * Ver docs/04-motor-valuacion.md y docs/08-especificacion-claude-code.md (§8.7).
 */

/** Familias de multiplo (ver docs/04 §4.15 y anexo-rubros.md). */
export type Familia =
  | "servicios_profesionales"
  | "gastronomia"
  | "comercio_minorista"
  | "mayorista_distribucion"
  | "industria_manufactura"
  | "salud_bienestar"
  | "tecnologia_digital"
  | "ecommerce"
  | "logistica_transporte"
  | "construccion"
  | "educacion"
  | "belleza_estetica_fitness"
  | "agro"
  | "turismo_hoteleria"
  | "inmobiliario_rentas"
  | "otros";

export type Moneda = "ARS" | "USD";
export type Tendencia = "crece" | "estable" | "baja";
export type Dependencia = "baja" | "media" | "alta";
export type AnioRepresentativo = "normal" | "mejor" | "peor";
export type DeudaTransfiere = "quedan" | "transfieren";
export type ClaseTamanio = "micro" | "pequenia" | "mediana" | "grande";
export type BaseGanancia = "SDE" | "EBITDA";
export type MetodoPredominante = "multiplos" | "dcf" | "mixto" | "activos";

/**
 * Entrada del motor. Los montos van en `monedaCarga` y en base ANUAL.
 * (La capa de formulario se encarga de anualizar montos mensuales antes de llamar al motor.)
 */
export interface EngineInput {
  // --- Identidad / rubro ---
  familia: Familia;
  antiguedadAnios: number;
  empleados: number;
  duenosTrabajan: number;

  // --- Moneda ---
  monedaCarga: Moneda;
  /** Tipo de cambio de referencia: ARS por USD (dolar MEP). Requerido si monedaCarga = ARS. */
  tcRef: number;

  // --- Ventas (anual, en monedaCarga) ---
  ventasAnual: number;
  anioRepresentativo?: AnioRepresentativo;
  concentracionClientePct?: number; // 0-100

  // --- Costos y gastos (anual, en monedaCarga) ---
  cogsModo: "pct" | "monto";
  cogsPct?: number; // 0-100 (si modo pct)
  cogsMonto?: number; // anual (si modo monto)
  gastosFijosAnual: number; // operativos, SIN retiros de duenios

  // --- Normalizacion (anual, en monedaCarga) ---
  retiroDuenosAnual?: number; // informativo/validacion
  sueldoMercadoDuenoAnual: number;
  gastosPersonalesAnual?: number;
  extraordGasto?: number;
  extraordIngreso?: number;

  // --- Activos y capital de trabajo (stock, en monedaCarga) ---
  inventario?: number;
  inventarioMinimo?: number;
  porCobrar?: number;
  porPagar?: number;
  equipamiento?: number;
  inmuebleIncluido?: boolean;
  inmuebleValor?: number;

  // --- Deudas (en monedaCarga) ---
  deudaFinanciera?: number;
  deudaOtros?: number;
  contingencias?: number;
  deudaTransfiere?: DeudaTransfiere;

  // --- Perspectivas ---
  tendencia: Tendencia;
  crecimientoPct?: number; // real, sin inflacion (-50..100)
  dependenciaDueno: Dependencia;
  recurrencia?: boolean;
}

export interface AjusteMultiplo {
  factor: string;
  delta: number; // proporcion aplicada al multiplo base
}

export interface FilaDcf {
  anio: number;
  ventas: number;
  ebitda: number;
  fcf: number;
  vp: number; // valor presente del fcf
}

export interface Driver {
  factor: string;
  efecto: "sube" | "baja" | "neutro";
  detalle: string;
}

export interface Escenarios {
  conservador: number;
  base: number;
  optimista: number;
}

export interface EngineFlags {
  noRentable: boolean;
  assetHeavy: boolean;
  grande: boolean;
  datosAtipicos: boolean;
  dcfAplicado: boolean;
  pisoActivosAplicado: boolean;
}

export interface EngineResult {
  engineVersion: string;
  monedaResultado: "USD";
  tcRef: number;

  // Ganancias normalizadas (USD)
  sdeUSD: number;
  ebitdaUSD: number;
  margenSde: number; // SDE / ventas

  // Clasificacion
  claseTamanio: ClaseTamanio;
  familia: Familia;
  baseGanancia: BaseGanancia;
  baseGananciaUSD: number;

  // Metodos (USD)
  multiploFinal: number;
  valorMultiplosUSD: number;
  valorDcfUSD: number | null;
  valorActivosUSD: number;

  // Resultado (USD)
  valorCentralUSD: number;
  rangoMinUSD: number;
  rangoMaxUSD: number;

  // Resultado (ARS)
  valorCentralARS: number;
  rangoMinARS: number;
  rangoMaxARS: number;

  escenariosUSD: Escenarios;
  tablaDcf: FilaDcf[] | null;
  metodoPredominante: MetodoPredominante;
  drivers: Driver[];
  ajustesMultiplo: AjusteMultiplo[];
  precisionPct: number;
  flags: EngineFlags;
}

/** Rangos de multiplo de una familia. */
export interface MultiploRango {
  min: number;
  base: number;
  max: number;
}

export interface FamiliaParams {
  sde: MultiploRango;
  /** Margen SDE tipico del rubro (SDE/ventas), para el ajuste de margen. */
  margenTipico: number;
  /** Capital de trabajo tipico como % de ventas. */
  wcPct: number;
  /** Capex de mantenimiento como % de ventas. */
  capexMantPct: number;
  assetHeavy: boolean;
}

export interface EngineParams {
  version: string;
  familias: Record<Familia, FamiliaParams>;

  // Umbrales de tamanio (facturacion anual USD)
  umbralMicro: number; // < => micro
  umbralPequenia: number; // < => pequenia
  umbralMediana: number; // < => mediana ; >= => grande

  // Multiplo EBITDA para medianas = multiplo SDE + offset
  ebitdaMultiploOffset: number;

  // Tasa de descuento (real, USD) - build up
  rLibreUSD: number;
  primaPaisAR: number;
  primaTamanio: Record<ClaseTamanio, number>;

  // DCF
  tEfectiva: number;
  gTerminal: number;
  aniosProyeccion: number;

  // Crecimiento
  gDefault: Record<Tendencia, number>;
  gMin: number;
  gMax: number;

  // Ponderaciones
  wMultiplos: number;
  wDcf: number;

  // Incertidumbre
  anchoBase: number;
  anchoMax: number;

  // Escenarios: shifts
  multiploFactorConservador: number;
  multiploFactorOptimista: number;
  gShiftEscenario: number;
  rShiftEscenario: number;
}
