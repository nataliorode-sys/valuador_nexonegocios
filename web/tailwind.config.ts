import type { Config } from "tailwindcss";

// Paleta preliminar (a reemplazar por la guia visual de marca de NexoNegocios).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nexo: {
          DEFAULT: "#0B3B6F", // azul NexoNegocios (placeholder)
          dark: "#082a4f",
          accent: "#1F9D8F", // verde acento (placeholder)
          soft: "#EAF2FB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
