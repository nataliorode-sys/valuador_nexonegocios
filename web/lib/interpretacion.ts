// Genera el análisis en lenguaje llano del informe: observaciones (fortalezas /
// puntos a mejorar), recomendaciones para aumentar el valor, y la explicación del método.
import { DEFAULT_PARAMS, type Desglose } from "@nexodirecto/engine";

export interface Observacion {
  tipo: "fortaleza" | "riesgo" | "neutro";
  texto: string;
}
export interface Analisis {
  metodoTexto: string;
  margenTexto: string;
  observaciones: Observacion[];
  recomendaciones: string[];
}

const METODO_NOMBRE: Record<string, string> = {
  multiplos: "múltiplos de mercado",
  dcf: "flujo de fondos proyectado",
  mixto: "una combinación de múltiplos de mercado y flujo de fondos",
  activos: "el valor de sus activos",
};

interface Datos {
  dependenciaDueno?: string;
  recurrencia?: boolean;
  concentracionClientePct?: number;
  tendencia?: string;
  crecimientoPct?: number;
  anioInicio?: number;
  intangibles?: string[];
  anioRepresentativo?: string;
  datosMano?: string;
}

interface Resultado {
  familia: string;
  baseGanancia: string;
  metodoPredominante: string;
  multiploFinal: number;
  sdeUsd: number;
  ebitdaUsd: number;
  flags: { noRentable?: boolean; assetHeavy?: boolean } | null;
}

const fmt = (v: number) => "USD " + Math.round(v).toLocaleString("es-AR");

export function interpretar(datos: Datos, r: Resultado, g: Desglose): Analisis {
  const obs: Observacion[] = [];
  const rec: string[] = [];
  const antiguedad = datos.anioInicio && datos.anioInicio > 0 ? 2026 - datos.anioInicio : null;
  const margenTipico = DEFAULT_PARAMS.familias[r.familia as keyof typeof DEFAULT_PARAMS.familias]?.margenTipico ?? 0.15;
  const noRentable = r.flags?.noRentable ?? false;

  // --- Método ---
  const base = r.baseGanancia === "EBITDA" ? "EBITDA normalizado" : "ganancia del dueño (SDE)";
  const baseVal = r.baseGanancia === "EBITDA" ? r.ebitdaUsd : r.sdeUsd;
  const metodoTexto = noRentable
    ? "Como tu negocio hoy no muestra ganancias normalizadas positivas, valuamos principalmente por el valor de sus activos. Un negocio rentable suele valer bastante más que sus activos."
    : `Valuamos usando ${METODO_NOMBRE[r.metodoPredominante] ?? r.metodoPredominante}. Tomamos tu ${base} de ${fmt(baseVal)} por año y le aplicamos un múltiplo de ${r.multiploFinal}×, ajustado según las características de tu negocio (crecimiento, dependencia del dueño, antigüedad, etc.).`;

  // --- Margen ---
  let margenTexto: string;
  if (g.margenSde >= margenTipico * 1.2) {
    margenTexto = `Tu rentabilidad (${(g.margenSde * 100).toFixed(0)}% de las ventas) es superior al promedio de tu rubro (~${(margenTipico * 100).toFixed(0)}%). Es una de las principales fortalezas de tu valuación.`;
    obs.push({ tipo: "fortaleza", texto: "Rentabilidad por encima del promedio del rubro." });
  } else if (g.margenSde <= margenTipico * 0.8) {
    margenTexto = `Tu rentabilidad (${(g.margenSde * 100).toFixed(0)}% de las ventas) está por debajo del promedio de tu rubro (~${(margenTipico * 100).toFixed(0)}%). Mejorarla es la palanca más directa para subir el valor.`;
    obs.push({ tipo: "riesgo", texto: "Rentabilidad por debajo del promedio del rubro." });
    rec.push("Revisá precios y costos: incluso una mejora chica del margen impacta fuerte en el valor.");
  } else {
    margenTexto = `Tu rentabilidad (${(g.margenSde * 100).toFixed(0)}% de las ventas) está en línea con el promedio de tu rubro.`;
  }

  // --- Dependencia del dueño ---
  if (datos.dependenciaDueno === "baja") {
    obs.push({ tipo: "fortaleza", texto: "El negocio funciona sin depender del dueño: eso lo hace más vendible y más valioso." });
  } else if (datos.dependenciaDueno === "alta") {
    obs.push({ tipo: "riesgo", texto: "El negocio depende mucho del dueño, lo que reduce el valor y complica la transición." });
    rec.push("Documentá procesos y delegá tareas clave: reducir la dependencia del dueño aumenta el valor y la confianza del comprador.");
  }

  // --- Concentración de clientes ---
  const conc = Number(datos.concentracionClientePct ?? 0);
  if (conc > 30) {
    obs.push({ tipo: "riesgo", texto: `Un solo cliente concentra el ${conc}% de las ventas: es un riesgo que los compradores penalizan.` });
    rec.push("Diversificá tu cartera de clientes para reducir la dependencia de los más grandes.");
  }

  // --- Recurrencia ---
  if (datos.recurrencia === true) {
    obs.push({ tipo: "fortaleza", texto: "Tenés ingresos recurrentes / clientes que vuelven: da previsibilidad y sube el valor." });
  } else {
    rec.push("Sumá ingresos recurrentes (abonos, contratos, membresías): la previsibilidad de ingresos vale mucho.");
  }

  // --- Tendencia ---
  if (datos.tendencia === "crece") {
    obs.push({ tipo: "fortaleza", texto: "El negocio está en crecimiento, lo que impulsa la valuación." });
  } else if (datos.tendencia === "baja") {
    obs.push({ tipo: "riesgo", texto: "El negocio muestra una tendencia a la baja, lo que reduce el valor." });
  }

  // --- Antigüedad ---
  if (antiguedad && antiguedad >= 10) {
    obs.push({ tipo: "fortaleza", texto: `Trayectoria de ${antiguedad} años: la antigüedad transmite solidez y confianza.` });
  } else if (antiguedad && antiguedad < 3) {
    obs.push({ tipo: "riesgo", texto: "El negocio tiene poca antigüedad, por lo que hay menos historia para respaldar la proyección." });
  }

  // --- Intangibles ---
  if (datos.intangibles?.length) {
    obs.push({ tipo: "fortaleza", texto: `Incluís intangibles de valor (${datos.intangibles.slice(0, 3).join(", ")}) que suman al atractivo de la operación.` });
  }

  // --- Calidad de la información ---
  if (datos.datosMano === "no" || (datos.anioRepresentativo && datos.anioRepresentativo !== "normal")) {
    obs.push({ tipo: "neutro", texto: "Parte de la información fue estimada o el último año no fue típico: la estimación es más incierta. Con datos más precisos afinamos el rango." });
  }

  // Recomendaciones genéricas de cierre
  rec.push("Ordená y mostrá tus números (ventas, costos, márgenes): la transparencia genera confianza y acelera la venta.");
  if (noRentable) rec.unshift("Enfocate en volver el negocio rentable: es lo que más cambia el valor de venta.");

  return { metodoTexto, margenTexto, observaciones: obs, recomendaciones: rec.slice(0, 6) };
}
