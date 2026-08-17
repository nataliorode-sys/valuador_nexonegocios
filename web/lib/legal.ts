// Datos legales de la empresa. COMPLETAR con los datos reales antes de operar.
// Estos valores alimentan las páginas /terminos, /privacidad y los avisos legales.
//
// ⚠️ IMPORTANTE: los textos legales de la app son BORRADORES orientativos.
// Deben ser revisados por un/a abogado/a matriculado/a (protección de datos Ley 25.326
// y defensa del consumidor Ley 24.240 / CCyC) antes de operar con clientes reales.

export const EMPRESA = {
  nombreFantasia: "NexoNegocios",
  producto: "NexoDirecto",
  razonSocial: "NEXO NEGOCIOS SAS",
  cuit: "30-71935898-1",
  domicilio: "Armenia 2319 2C, C.A.B.A.",
  email: "contacto@nexonegocios.com.ar",
  sitioWeb: "https://www.nexonegocios.com.ar",
  jurisdiccion: "los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires",
  vigenciaDesde: "agosto de 2026",
} as const;

// Versión de los documentos legales (para registrar qué versión aceptó cada usuario).
export const VERSION_LEGAL = "2026-08-1";
