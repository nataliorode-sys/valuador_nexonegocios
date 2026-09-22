// Spec de campos editables por el moderador. Módulo plano (sin "use server"):
// lo usan la acción (parseo) y la página (render).

export type AdminField =
  | { id: string; label: string; kind: "text" | "textarea" | "num" | "money" | "moneyP" }
  | { id: string; label: string; kind: "select"; opciones: { v: string; l: string }[] };

export const ADMIN_GRUPOS: { titulo: string; campos: AdminField[] }[] = [
  {
    titulo: "El negocio",
    campos: [
      { id: "actividadDesc", label: "Actividad", kind: "textarea" },
      { id: "provincia", label: "Provincia", kind: "text" },
      { id: "localidad", label: "Localidad", kind: "text" },
      { id: "anioInicio", label: "Año de inicio", kind: "num" },
      { id: "empleados", label: "Empleados (sin dueños)", kind: "num" },
      { id: "duenosTrabajan", label: "Dueños que trabajan", kind: "num" },
      { id: "local", label: "Local", kind: "select", opciones: [
        { v: "propio", l: "Propio" }, { v: "alquilado", l: "Alquilado" }, { v: "na", l: "No aplica" },
      ] },
    ],
  },
  {
    titulo: "Ventas",
    campos: [
      { id: "ventasCargaModo", label: "Modo de carga de ventas", kind: "select", opciones: [
        { v: "anual", l: "Total anual" }, { v: "promedio", l: "Promedio mensual (×12)" },
      ] },
      { id: "ventasAnual", label: "Ventas de los últimos 12 meses", kind: "money" },
      { id: "ventasProm", label: "Ventas de un mes típico", kind: "money" },
    ],
  },
  {
    titulo: "Costos",
    campos: [
      { id: "cogsModo", label: "Modo de costo de mercadería", kind: "select", opciones: [
        { v: "pct", l: "% de las ventas" }, { v: "monto", l: "Monto anual" },
      ] },
      { id: "cogsPct", label: "Costo de mercadería (%)", kind: "num" },
      { id: "cogsMonto", label: "Costo de mercadería (monto anual)", kind: "money" },
    ],
  },
  {
    titulo: "Gastos fijos",
    campos: [
      { id: "gAlquiler", label: "Alquiler del local", kind: "moneyP" },
      { id: "gSueldos", label: "Sueldos de empleados", kind: "moneyP" },
      { id: "gServicios", label: "Servicios", kind: "moneyP" },
      { id: "gLogistica", label: "Logística / fletes", kind: "moneyP" },
      { id: "gPublicidad", label: "Publicidad", kind: "moneyP" },
      { id: "gComisiones", label: "Comisiones", kind: "moneyP" },
      { id: "gImpuestos", label: "Impuestos y tasas", kind: "moneyP" },
      { id: "gOtros", label: "Otros gastos", kind: "moneyP" },
    ],
  },
  {
    titulo: "Retiros del dueño",
    campos: [
      { id: "retiroDuenos", label: "Retiro de los dueños", kind: "moneyP" },
      { id: "sueldoMercadoDueno", label: "Sueldo de mercado del dueño", kind: "moneyP" },
      { id: "gastosPersonales", label: "Gastos personales por la empresa (anual)", kind: "money" },
    ],
  },
];

export const ADMIN_CAMPOS = ADMIN_GRUPOS.flatMap((g) => g.campos);

export function parseNumOrUndef(v: FormDataEntryValue | null): number | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}
