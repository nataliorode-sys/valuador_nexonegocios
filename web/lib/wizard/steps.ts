// Definicion de los pasos y campos del wizard (ver docs/03-formulario.md).
// Fuente unica de verdad para render y validacion.
import type { FormData, Opcion, StepDef } from "./types.js";

export const FAMILIAS: Opcion[] = [
  { value: "servicios_profesionales", label: "Servicios profesionales" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "comercio_minorista", label: "Comercio minorista" },
  { value: "mayorista_distribucion", label: "Mayorista / distribución" },
  { value: "industria_manufactura", label: "Industria / manufactura" },
  { value: "salud_bienestar", label: "Salud y bienestar" },
  { value: "tecnologia_digital", label: "Tecnología / digital" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "logistica_transporte", label: "Logística / transporte" },
  { value: "construccion", label: "Construcción / obra" },
  { value: "educacion", label: "Educación" },
  { value: "belleza_estetica_fitness", label: "Belleza / estética / fitness" },
  { value: "agro", label: "Agro / producción primaria" },
  { value: "turismo_hoteleria", label: "Turismo / hotelería" },
  { value: "inmobiliario_rentas", label: "Inmobiliario / rentas" },
  { value: "otros", label: "Otro" },
];

const PROVINCIAS: Opcion[] = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
].map((p) => ({ value: p, label: p }));

const stockFamilias = new Set([
  "gastronomia", "comercio_minorista", "mayorista_distribucion", "industria_manufactura",
  "ecommerce", "agro", "salud_bienestar", "construccion", "belleza_estetica_fitness", "otros",
]);
export function familiaTieneStock(data: FormData): boolean {
  return stockFamilias.has(String(data.familia ?? ""));
}

// --- Pasos del wizard (W1..W7). La elegibilidad (S5) se maneja aparte. ---
export const STEPS: StepDef[] = [
  {
    id: "w1",
    titulo: "Tu negocio",
    descripcion: "Contanos qué hacés y dónde.",
    fields: [
      { id: "actividadDesc", label: "¿Qué hace tu empresa?", type: "textarea", required: true,
        help: "Se usa (editable) en tu publicación.", ejemplo: "Panadería y cafetería de barrio con venta al público y delivery", min: 30 },
      { id: "provincia", label: "Provincia", type: "select", required: true, opciones: PROVINCIAS },
      { id: "localidad", label: "Localidad", type: "text", required: true, ejemplo: "Villa Carlos Paz" },
      { id: "anioInicio", label: "¿En qué año empezó a operar?", type: "int", required: true, min: 1900, max: 2026, ejemplo: "2018" },
      { id: "formaJuridica", label: "Forma jurídica", type: "select",
        opciones: ["Unipersonal", "Monotributo", "SRL", "SA", "SAS", "Otra"].map((v) => ({ value: v, label: v })) },
      { id: "empleados", label: "¿Cuántos empleados tenés (sin contar dueños)?", type: "int", required: true, min: 0, ejemplo: "8" },
      { id: "duenosTrabajan", label: "¿Cuántos dueños trabajan en el negocio?", type: "int", required: true, min: 0, ejemplo: "2" },
      { id: "local", label: "El local donde operás es…", type: "select", required: true,
        opciones: [{ value: "propio", label: "Propio" }, { value: "alquilado", label: "Alquilado" }, { value: "na", label: "No aplica" }] },
    ],
  },
  {
    id: "w2",
    titulo: "Ventas",
    descripcion: "Cuánto vendés hoy.",
    fields: [
      { id: "monedaCarga", label: "¿En qué moneda cargás los números?", type: "select", required: true,
        opciones: [{ value: "ARS", label: "Pesos (ARS)" }, { value: "USD", label: "Dólares (USD)" }] },
      { id: "ventasCargaModo", label: "¿Cómo querés cargar tus ventas?", type: "select", required: true,
        opciones: [{ value: "anual", label: "Total anual" }, { value: "promedio", label: "Promedio de un mes típico" }] },
      { id: "ventasAnual", label: "Ventas de los últimos 12 meses", type: "money", required: true,
        help: "Facturación total, sin IVA.", ejemplo: "240.000.000", showIf: (d) => d.ventasCargaModo !== "promedio" },
      { id: "ventasProm", label: "Ventas de un mes típico", type: "money", required: true,
        help: "Se multiplica por 12.", showIf: (d) => d.ventasCargaModo === "promedio" },
      { id: "anioRepresentativo", label: "¿El último año fue \"normal\"?", type: "select", required: true,
        opciones: [{ value: "normal", label: "Sí, fue normal" }, { value: "mejor", label: "Fue mejor de lo normal" }, { value: "peor", label: "Fue peor de lo normal" }] },
      { id: "estacional", label: "¿Tus ventas se concentran en ciertos meses?", type: "bool" },
      { id: "concentracionClientePct", label: "¿Qué % de las ventas hace tu cliente más grande?", type: "percent",
        help: "Mucha concentración = más riesgo.", ejemplo: "15" },
    ],
  },
  {
    id: "w3",
    titulo: "Costos y gastos",
    descripcion: "Cuánto te cuesta operar. No incluyas lo que retirás como dueño (eso va en el paso siguiente).",
    fields: [
      { id: "cogsModo", label: "¿Cómo cargás el costo de lo que vendés?", type: "select", required: true,
        opciones: [{ value: "pct", label: "Como % de las ventas" }, { value: "monto", label: "Como monto anual" }] },
      { id: "cogsPct", label: "Costo de mercadería / insumos (% de ventas)", type: "percent", required: true,
        help: "Lo que te cuesta lo que vendés, sin gastos fijos.", ejemplo: "40", showIf: (d) => d.cogsModo !== "monto" },
      { id: "cogsMonto", label: "Costo de mercadería / insumos (anual)", type: "money", required: true,
        showIf: (d) => d.cogsModo === "monto" },
      { id: "gAlquiler", label: "Alquiler del local", type: "moneyPeriod",
        showIf: (d) => d.local === "alquilado", help: "Solo si el local es alquilado." },
      { id: "gSueldos", label: "Sueldos de empleados (con cargas)", type: "moneyPeriod",
        help: "No incluyas a los dueños." },
      { id: "gServicios", label: "Servicios (luz, gas, internet, teléfono)", type: "moneyPeriod" },
      { id: "gLogistica", label: "Logística, fletes, combustible", type: "moneyPeriod" },
      { id: "gPublicidad", label: "Publicidad y marketing", type: "moneyPeriod" },
      { id: "gComisiones", label: "Comisiones (tarjetas, plataformas, vendedores)", type: "moneyPeriod" },
      { id: "gImpuestos", label: "Impuestos y tasas (IIBB, municipal)", type: "moneyPeriod" },
      { id: "gOtros", label: "Otros gastos", type: "moneyPeriod" },
    ],
  },
  {
    id: "w4",
    titulo: "Tu sueldo y ajustes",
    descripcion: "Ajustamos el resultado para reflejar lo que realmente gana el negocio.",
    fields: [
      { id: "retiroDuenos", label: "¿Cuánto retiran en total los dueños que trabajan?", type: "moneyPeriod", required: true,
        help: "Sueldos + retiros de todos los dueños." },
      { id: "sueldoMercadoDueno", label: "Si contrataras a alguien para hacer lo que hacés vos, ¿cuánto le pagarías?", type: "moneyPeriod", required: true,
        help: "Sueldo de mercado del puesto del dueño." },
      { id: "gastosPersonales", label: "Gastos personales que pasás por la empresa (al año)", type: "money",
        help: "Auto, celular, viajes, etc. Se suman de vuelta.", ejemplo: "3.000.000" },
      { id: "extraordGasto", label: "Gastos por única vez en el último año", type: "money",
        help: "Juicio, mudanza, reparación grande." },
      { id: "extraordIngreso", label: "Ingresos por única vez en el último año", type: "money",
        help: "Venta de un activo, indemnización cobrada, etc." },
    ],
  },
  {
    id: "w5",
    titulo: "Activos",
    descripcion: "Qué se lleva el comprador con la empresa.",
    fields: [
      { id: "inventario", label: "Valor de tu stock / mercadería hoy", type: "money",
        showIf: familiaTieneStock, help: "A precio de costo." },
      { id: "inventarioMinimo", label: "Stock mínimo para que el negocio funcione", type: "money",
        showIf: familiaTieneStock, help: "Capital de trabajo básico." },
      { id: "porCobrar", label: "¿Cuánto te deben tus clientes hoy?", type: "money" },
      { id: "porPagar", label: "¿Cuánto les debés a proveedores hoy?", type: "money" },
      { id: "equipamiento", label: "Valor de equipos, maquinaria, herramientas, rodados", type: "money",
        help: "A valor de usado / mercado.", ejemplo: "20.000.000" },
      { id: "inmuebleIncluido", label: "¿El inmueble propio se incluye en la venta?", type: "bool",
        showIf: (d) => d.local === "propio" },
      { id: "inmuebleValor", label: "Valor estimado del inmueble", type: "money",
        showIf: (d) => d.local === "propio" && d.inmuebleIncluido === true },
      { id: "incluyeVenta", label: "¿Qué se incluye en la venta?", type: "multiselect",
        opciones: ["Fondo de comercio", "Stock", "Equipos", "Inmueble", "Marca", "Cartera de clientes", "Empleados", "Intangibles digitales"].map((v) => ({ value: v, label: v })) },
      { id: "intangibles", label: "¿Qué intangibles se llevan con la empresa?", type: "multiselect",
        opciones: ["Marca registrada", "Página web", "Redes sociales", "Cartera de clientes", "Base de datos", "Recetas / procesos", "Licencias / habilitaciones", "Contratos vigentes"].map((v) => ({ value: v, label: v })) },
    ],
  },
  {
    id: "w6",
    titulo: "Deudas",
    descripcion: "Qué debe la empresa hoy.",
    fields: [
      { id: "deudaFinanciera", label: "Deudas con bancos o préstamos", type: "money" },
      { id: "deudaOtros", label: "Otras deudas (proveedores atrasados, AFIP)", type: "money" },
      { id: "contingencias", label: "Juicios o contingencias (monto estimado)", type: "money" },
      { id: "deudaTransfiere", label: "Las deudas, ¿las asume el comprador o quedan con vos?", type: "select", required: true,
        opciones: [{ value: "quedan", label: "Quedan con el dueño" }, { value: "transfieren", label: "Se transfieren al comprador" }] },
    ],
  },
  {
    id: "w7",
    titulo: "Perspectivas",
    descripcion: "Hacia dónde va tu negocio.",
    fields: [
      { id: "tendencia", label: "Mirando para adelante, tu negocio…", type: "select", required: true,
        opciones: [{ value: "crece", label: "Va a crecer" }, { value: "estable", label: "Se mantiene" }, { value: "baja", label: "Va a bajar" }] },
      { id: "crecimientoPct", label: "¿Cuánto esperás crecer por año? (real, sin inflación)", type: "percent",
        help: "Opcional. Ej: 5", min: -50, max: 100 },
      { id: "dependenciaDueno", label: "Si el dueño se va, el negocio…", type: "select", required: true,
        opciones: [{ value: "baja", label: "Sigue igual" }, { value: "media", label: "Se complica un poco" }, { value: "alta", label: "Depende mucho de él" }] },
      { id: "recurrencia", label: "¿Tenés ventas recurrentes o contratos fijos?", type: "bool" },
      { id: "motivoVenta", label: "¿Por qué querés vender?", type: "select", required: true,
        opciones: ["Retiro", "Nuevo proyecto", "Salud", "Mudanza", "Sociedad", "Bajó la rentabilidad", "Otro"].map((v) => ({ value: v, label: v })) },
      { id: "urgencia", label: "¿Con qué urgencia querés vender?", type: "select",
        opciones: [{ value: "sin_apuro", label: "Sin apuro" }, { value: "6_meses", label: "En 6 meses" }, { value: "urgente", label: "Lo antes posible" }] },
    ],
  },
];

export function stepById(id: string): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}
