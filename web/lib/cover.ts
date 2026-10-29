// Portada de marca para publicaciones SIN foto propia.
// Genera un SVG (string) con el título + rubro sobre fondo navy NexoNegocios y un
// acento por rubro. Se sirve desde /api/cover/[codigo] y se usa como fallback en
// las tarjetas del marketplace, la ficha, el flyer y la API que consume WordPress,
// para que una publicación sin foto se vea intencional y de marca, no rota.
import { acentoPara } from "@/lib/flyerTheme";
import { familiaLabel } from "@/lib/publicacion";

const NAVY = "#0b1c2e";
const NAVY2 = "#13304a";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

// Corta el título en como máximo `maxLineas` líneas de ~`maxCh` caracteres,
// cerrando con … si quedó texto afuera.
function wrap(titulo: string, maxCh = 20, maxLineas = 3): string[] {
  const palabras = titulo.trim().split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const tentativa = actual ? `${actual} ${p}` : p;
    if (tentativa.length <= maxCh || !actual) {
      actual = tentativa;
    } else {
      lineas.push(actual);
      actual = p;
      if (lineas.length === maxLineas) break;
    }
  }
  if (lineas.length < maxLineas && actual) lineas.push(actual);
  // ¿Quedó texto sin ubicar? Marcar la última línea con …
  const ubicado = lineas.join(" ");
  if (lineas.length >= maxLineas && ubicado.replace(/\s+/g, " ").length < titulo.trim().replace(/\s+/g, " ").length) {
    const i = lineas.length - 1;
    lineas[i] = (lineas[i].length > maxCh - 1 ? lineas[i].slice(0, maxCh - 1) : lineas[i]).replace(/\s+$/, "") + "…";
  }
  return lineas.length ? lineas : [titulo.slice(0, maxCh) || "Empresa en venta"];
}

export function coverSvg(opts: { titulo: string; familia: string }): string {
  const accent = acentoPara(opts.familia);
  const rubro = familiaLabel(opts.familia);
  const lineas = wrap(opts.titulo || rubro);
  const W = 1200;
  const H = 800;
  const lh = 104;
  const centerY = 440;
  const startY = centerY - ((lineas.length - 1) * lh) / 2;
  const tspans = lineas
    .map((l, i) => `<tspan x="${W / 2}" y="${startY + i * lh}">${esc(l)}</tspan>`)
    .join("");
  const SANS = "Montserrat, 'Helvetica Neue', Arial, sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.titulo || rubro)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="12" fill="${accent}"/>
  <g opacity="0.07" transform="translate(760,300) scale(18)">
    <path d="M23 50 L23 16 L51 46 L51 13" stroke="#ffffff" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M16 50 L16 16 L44 46 L44 13" stroke="${accent}" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <g transform="translate(90,92)">
    <svg viewBox="0 0 62 60" width="52" height="52" x="0" y="-38">
      <path d="M23 50 L23 16 L51 46 L51 13" stroke="#DFE6EC" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M16 50 L16 16 L44 46 L44 13" stroke="#45B649" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
    <text x="66" y="0" font-family="${SANS}" font-size="32" font-weight="800" fill="#ffffff">Nexo<tspan fill="#45B649">Negocios</tspan></text>
  </g>
  <text x="${W / 2}" y="${startY - 118}" text-anchor="middle" font-family="${SANS}" font-size="34" font-weight="700" letter-spacing="3" fill="${accent}">${esc(rubro.toUpperCase())}</text>
  <text text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="800" fill="#ffffff">${tspans}</text>
  <text x="${W / 2}" y="${H - 72}" text-anchor="middle" font-family="${SANS}" font-size="30" font-weight="600" letter-spacing="2" fill="#8aa0b6">EN VENTA · NEXODIRECTO</text>
</svg>`;
}
