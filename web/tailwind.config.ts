import type { Config } from "tailwindcss";

// Identidad de marca NexoNegocios (estética corporativa/M&A, Montserrat).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nexo: {
          DEFAULT: "#0B1C2E", // azul principal (títulos, botones primarios)
          dark: "#15314D", // azul secundario (hover)
          accent: "#45B649", // verde Nexo (acentos, marca)
          green: "#45B649",
          greenDark: "#2F8F38", // verde oscuro (botones verdes, hover)
          soft: "#F5F7F9", // fondo claro
          ink: "#132033", // texto principal
          muted: "#607083", // texto secundario
          border: "#DFE6EC", // bordes
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
