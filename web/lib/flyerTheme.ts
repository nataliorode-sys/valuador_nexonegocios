// Color de acento del flyer según el rubro (diseño claro y vivo).
const ACENTOS: Record<string, string> = {
  gastronomia: "#F59E0B", // ámbar
  comercio_minorista: "#2563EB", // azul
  mayorista_distribucion: "#2563EB",
  belleza_estetica_fitness: "#EC4899", // rosa
  tecnologia_digital: "#0EA5E9", // celeste
  ecommerce: "#0EA5E9",
  salud_bienestar: "#14B8A6", // teal
  agro: "#22C55E",
  turismo_hoteleria: "#22C55E",
  industria_manufactura: "#6366F1", // índigo
  construccion: "#F97316", // naranja
  educacion: "#8B5CF6", // violeta
  logistica_transporte: "#0EA5E9",
  servicios_profesionales: "#2F8F38",
  inmobiliario_rentas: "#2F8F38",
  otros: "#2F8F38",
};

export function acentoPara(familia: string): string {
  return ACENTOS[familia] ?? "#2F8F38";
}
