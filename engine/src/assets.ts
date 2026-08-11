/**
 * Valor por activos netos (piso, y primario si no hay rentabilidad).
 * Ver docs/04-motor-valuacion.md §4.6 y equity bridge §4.14.
 */
import type { NormalizedInput } from "./normalize.js";

/** Deuda que se resta del valor (solo si se transfiere al comprador). */
export function deudaTransferida(n: NormalizedInput): number {
  if (n.deudaTransfiere !== "transfieren") return 0;
  return n.deudaFinanciera + n.deudaOtros + n.contingencias;
}

/**
 * Activos netos (equity). Incluye todo: equipamiento, inventario, cuentas,
 * inmueble (si va en la venta), menos pasivos transferidos.
 */
export function computeActivosNetos(n: NormalizedInput): number {
  const inmueble = n.inmuebleIncluido ? n.inmuebleValor : 0;
  const bruto = n.equipamiento + n.inventario + n.porCobrar + inmueble;
  const neto = bruto - n.porPagar - deudaTransferida(n);
  return neto;
}

/**
 * Inventario en EXCESO del normal operativo (para no doble-contar contra el
 * multiplo, que ya incluye el capital de trabajo normal). §4.7.
 */
export function excesoInventario(n: NormalizedInput, wcPctFamilia: number): number {
  const normal = n.inventarioMinimo != null ? n.inventarioMinimo : wcPctFamilia * n.ventas;
  return Math.max(0, n.inventario - normal);
}
