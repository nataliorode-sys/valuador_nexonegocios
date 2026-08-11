/**
 * Demo de salida del motor. Correr con:
 *   node --experimental-strip-types examples/demo.ts
 */
import { valuar, type EngineInput } from "../src/index.js";

const ejemplo: EngineInput = {
  familia: "gastronomia",
  antiguedadAnios: 6,
  empleados: 8,
  duenosTrabajan: 2,
  monedaCarga: "ARS",
  tcRef: 1200,
  ventasAnual: 240_000_000,
  anioRepresentativo: "normal",
  concentracionClientePct: 10,
  cogsModo: "pct",
  cogsPct: 38,
  gastosFijosAnual: 120_000_000,
  retiroDuenosAnual: 30_000_000,
  sueldoMercadoDuenoAnual: 24_000_000,
  gastosPersonalesAnual: 6_000_000,
  inventario: 8_000_000,
  equipamiento: 40_000_000,
  inmuebleIncluido: false,
  deudaFinanciera: 10_000_000,
  deudaTransfiere: "quedan",
  tendencia: "crece",
  crecimientoPct: 5,
  dependenciaDueno: "media",
  recurrencia: false,
};

const r = valuar(ejemplo);
const fmtU = (v: number) => "USD " + v.toLocaleString("es-AR");
const fmtA = (v: number) => "ARS " + v.toLocaleString("es-AR");

console.log("=== NexoDirecto - Valuacion de muestra (Restaurante) ===");
console.log("Clase:", r.claseTamanio, "| Base:", r.baseGanancia, "| Familia:", r.familia);
console.log("SDE:", fmtU(r.sdeUSD), "| EBITDA norm:", fmtU(r.ebitdaUSD), "| Margen SDE:", (r.margenSde * 100).toFixed(1) + "%");
console.log("Multiplo final:", r.multiploFinal);
console.log("Metodo predominante:", r.metodoPredominante, "| Precision:", r.precisionPct + "%");
console.log("---");
console.log("Valor multiplos:", fmtU(r.valorMultiplosUSD));
console.log("Valor DCF      :", r.valorDcfUSD != null ? fmtU(r.valorDcfUSD) : "n/a");
console.log("Valor activos  :", fmtU(r.valorActivosUSD));
console.log("---");
console.log("VALOR CENTRAL  :", fmtU(r.valorCentralUSD), "|", fmtA(r.valorCentralARS));
console.log("RANGO          :", fmtU(r.rangoMinUSD), "-", fmtU(r.rangoMaxUSD));
console.log("               :", fmtA(r.rangoMinARS), "-", fmtA(r.rangoMaxARS));
console.log("Escenarios USD :", r.escenariosUSD);
console.log("Drivers        :", r.drivers.map((d) => `${d.factor} (${d.efecto})`).join(", "));
