// Tipos del wizard. Config data-driven: los pasos y campos se definen en steps.ts
// y se renderizan/validan de forma generica.

export type FieldType =
  | "text"
  | "textarea"
  | "int"
  | "money" // monto anual
  | "moneyPeriod" // monto con selector mensual/anual (companion field <id>Periodo)
  | "percent"
  | "select"
  | "multiselect"
  | "bool";

export interface Opcion {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  ejemplo?: string;
  opciones?: Opcion[];
  min?: number;
  max?: number;
  /** Se muestra solo si esta condicion se cumple. */
  showIf?: (data: FormData) => boolean;
}

export interface StepDef {
  id: string;
  titulo: string;
  descripcion: string;
  fields: FieldDef[];
}

/** Datos del formulario (valores crudos tal como se guardan en PerfilNegocio.datos). */
export type FormData = Record<string, string | number | boolean | string[] | undefined>;

export interface SoftWarning {
  fieldId?: string;
  mensaje: string;
}
