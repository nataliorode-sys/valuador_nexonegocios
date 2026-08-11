// Validaciones del wizard. Hard = bloquea avance. Soft = advierte, deja seguir.
import type { FieldDef, FormData, SoftWarning, StepDef } from "./types.js";

export function visibleFields(step: StepDef, data: FormData): FieldDef[] {
  return step.fields.filter((f) => (f.showIf ? f.showIf(data) : true));
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "number") return Number.isNaN(v);
  return false;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v.replace(/\./g, "").replace(",", "."));
  return NaN;
}

/** Errores hard de un paso: obligatorios y formato. */
export function validateStep(step: StepDef, data: FormData): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const f of visibleFields(step, data)) {
    const val = data[f.id];
    if (f.required && isEmpty(val)) {
      errores[f.id] = "Este dato es obligatorio.";
      continue;
    }
    if (isEmpty(val)) continue;

    if (f.type === "textarea" && f.min && String(val).trim().length < f.min) {
      errores[f.id] = `Escribí al menos ${f.min} caracteres.`;
    }
    if (["int", "money", "moneyPeriod", "percent"].includes(f.type)) {
      const n = toNum(val);
      if (Number.isNaN(n)) errores[f.id] = "Ingresá un número válido.";
      else if (n < 0) errores[f.id] = "No puede ser negativo.";
      else if (f.type === "percent" && (n < (f.min ?? 0) || n > (f.max ?? 100)))
        errores[f.id] = `Debe estar entre ${f.min ?? 0} y ${f.max ?? 100}.`;
      else if (f.min != null && n < f.min && f.type !== "percent")
        errores[f.id] = `Debe ser mayor o igual a ${f.min}.`;
      else if (f.max != null && n > f.max && f.type !== "percent")
        errores[f.id] = `Debe ser menor o igual a ${f.max}.`;
    }
  }
  return errores;
}

/** Advertencias de coherencia (soft). No bloquean; se muestran para confirmar. */
export function softWarnings(data: FormData): SoftWarning[] {
  const w: SoftWarning[] = [];
  const ventas = toNum(data.ventasCargaModo === "promedio" ? mult12(data.ventasProm) : data.ventasAnual);
  const cogs =
    data.cogsModo === "monto" ? toNum(data.cogsMonto) : (toNum(data.cogsPct) / 100) * ventas;

  if (Number.isFinite(ventas) && ventas > 0) {
    const gastos = sumaGastos(data);
    if (Number.isFinite(cogs) && cogs + gastos > ventas) {
      w.push({ mensaje: "Según los números, el negocio estaría dando pérdida operativa. ¿Es correcto?" });
    }
    const inv = toNum(data.inventario);
    if (Number.isFinite(inv) && inv > ventas) {
      w.push({ fieldId: "inventario", mensaje: "El stock parece muy alto respecto de tus ventas. ¿Está bien?" });
    }
  }

  const retiro = toNum(data.retiroDuenos);
  const duenos = toNum(data.duenosTrabajan);
  if (duenos > 0 && (Number.isNaN(retiro) || retiro === 0)) {
    w.push({ fieldId: "retiroDuenos", mensaje: "¿Los dueños no retiran nada? Cargá lo que se llevan para una mejor estimación." });
  }
  return w;
}

function mult12(v: unknown): number {
  const n = toNum(v);
  return Number.isNaN(n) ? NaN : n * 12;
}

function sumaGastos(data: FormData): number {
  const lineas = ["gAlquiler", "gSueldos", "gServicios", "gLogistica", "gPublicidad", "gComisiones", "gImpuestos", "gOtros"];
  let total = 0;
  for (const id of lineas) {
    const n = toNum(data[id]);
    if (!Number.isNaN(n)) {
      const per = data[`${id}Periodo`] === "anual" ? 1 : 12;
      total += n * per;
    }
  }
  return total;
}
