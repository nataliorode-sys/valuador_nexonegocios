// Mapea los datos del formulario al contrato del motor (EngineInput).
import type { EngineInput, Familia } from "@nexodirecto/engine";
import type { FormData } from "./types.js";

const ANIO_ACTUAL = 2026;

function n(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function money(data: FormData, id: string): number {
  const base = n(data[id]);
  const per = data[`${id}Periodo`] === "mensual" ? 12 : 1;
  return base * per;
}

function sumaGastosFijos(data: FormData): number {
  return (
    money(data, "gAlquiler") +
    money(data, "gSueldos") +
    money(data, "gServicios") +
    money(data, "gLogistica") +
    money(data, "gPublicidad") +
    money(data, "gComisiones") +
    money(data, "gImpuestos") +
    money(data, "gOtros")
  );
}

/**
 * Construye el EngineInput. `tcRef` (ARS por USD) proviene del parametro admin,
 * no del usuario.
 */
export function toEngineInput(data: FormData, tcRef: number): EngineInput {
  const anioInicio = n(data.anioInicio);
  const antiguedad = anioInicio > 0 ? Math.max(0, ANIO_ACTUAL - anioInicio) : 0;

  const ventasAnual =
    data.ventasCargaModo === "promedio" ? n(data.ventasProm) * 12 : n(data.ventasAnual);

  const input: EngineInput = {
    familia: (data.familia as Familia) ?? "otros",
    antiguedadAnios: antiguedad,
    empleados: n(data.empleados),
    duenosTrabajan: n(data.duenosTrabajan),

    monedaCarga: data.monedaCarga === "USD" ? "USD" : "ARS",
    tcRef,

    ventasAnual,
    anioRepresentativo:
      data.anioRepresentativo === "mejor" || data.anioRepresentativo === "peor"
        ? data.anioRepresentativo
        : "normal",
    concentracionClientePct: data.concentracionClientePct != null ? n(data.concentracionClientePct) : undefined,

    cogsModo: data.cogsModo === "monto" ? "monto" : "pct",
    cogsPct: data.cogsModo === "monto" ? undefined : n(data.cogsPct),
    cogsMonto: data.cogsModo === "monto" ? n(data.cogsMonto) : undefined,
    gastosFijosAnual: sumaGastosFijos(data),

    retiroDuenosAnual: money(data, "retiroDuenos"),
    sueldoMercadoDuenoAnual: money(data, "sueldoMercadoDueno"),
    gastosPersonalesAnual: data.gastosPersonales != null ? n(data.gastosPersonales) : undefined,
    extraordGasto: data.extraordGasto != null ? n(data.extraordGasto) : undefined,
    extraordIngreso: data.extraordIngreso != null ? n(data.extraordIngreso) : undefined,

    inventario: data.inventario != null ? n(data.inventario) : undefined,
    inventarioMinimo: data.inventarioMinimo != null ? n(data.inventarioMinimo) : undefined,
    porCobrar: data.porCobrar != null ? n(data.porCobrar) : undefined,
    porPagar: data.porPagar != null ? n(data.porPagar) : undefined,
    equipamiento: data.equipamiento != null ? n(data.equipamiento) : undefined,
    inmuebleIncluido: data.inmuebleIncluido === true,
    inmuebleValor: data.inmuebleValor != null ? n(data.inmuebleValor) : undefined,

    deudaFinanciera: data.deudaFinanciera != null ? n(data.deudaFinanciera) : undefined,
    deudaOtros: data.deudaOtros != null ? n(data.deudaOtros) : undefined,
    contingencias: data.contingencias != null ? n(data.contingencias) : undefined,
    deudaTransfiere: data.deudaTransfiere === "transfieren" ? "transfieren" : "quedan",

    tendencia:
      data.tendencia === "crece" || data.tendencia === "baja" ? data.tendencia : "estable",
    crecimientoPct: data.crecimientoPct != null ? n(data.crecimientoPct) : undefined,
    dependenciaDueno:
      data.dependenciaDueno === "baja" || data.dependenciaDueno === "alta"
        ? data.dependenciaDueno
        : "media",
    recurrencia: data.recurrencia === true,
  };
  return input;
}
