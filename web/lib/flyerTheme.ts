// Temas visuales del flyer, auto-seleccionados por familia de rubro (docs/07 §7.4).
export interface FlyerTheme {
  bg: string; // gradiente CSS
  accent: string;
  text: string;
  chip: string;
}

const TEMAS: Record<string, FlyerTheme> = {
  calido: { bg: "linear-gradient(160deg,#7a1f1f,#c0392b)", accent: "#45B649", text: "#fff", chip: "rgba(255,255,255,.15)" },
  sobrio: { bg: "linear-gradient(160deg,#0B1C2E,#15314D)", accent: "#45B649", text: "#fff", chip: "rgba(255,255,255,.10)" },
  moderno: { bg: "linear-gradient(160deg,#0B1C2E,#123a2a)", accent: "#45B649", text: "#fff", chip: "rgba(255,255,255,.12)" },
  natural: { bg: "linear-gradient(160deg,#14532d,#2F8F38)", accent: "#eaff9a", text: "#fff", chip: "rgba(255,255,255,.14)" },
};

const MAPA: Record<string, keyof typeof TEMAS> = {
  gastronomia: "calido",
  belleza_estetica_fitness: "calido",
  tecnologia_digital: "moderno",
  ecommerce: "moderno",
  agro: "natural",
  turismo_hoteleria: "natural",
  salud_bienestar: "sobrio",
};

export function temaPara(familia: string): FlyerTheme {
  return TEMAS[MAPA[familia] ?? "sobrio"];
}
