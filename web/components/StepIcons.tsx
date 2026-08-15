// Íconos de línea minimalistas (stroke) para los pasos de la landing.
// Monocromo: heredan el color por currentColor.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconCargar({ className = "" }: { className?: string }) {
  // Documento con lápiz: cargar datos
  return (
    <svg {...base} className={className}>
      <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19v-8" />
      <path d="M8.5 8.5h4M8.5 12h3" />
      <path d="M17.6 3.2a1.4 1.4 0 0 1 2 2L15 9.8l-2.6.6.6-2.6 4.6-4.6Z" />
    </svg>
  );
}

export function IconValor({ className = "" }: { className?: string }) {
  // Medidor / gauge: obtené tu valor
  return (
    <svg {...base} className={className}>
      <path d="M4.5 15a7.5 7.5 0 0 1 15 0" />
      <path d="M12 15l3.2-3.2" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <path d="M4.5 18.5h15" />
    </svg>
  );
}

export function IconPublicar({ className = "" }: { className?: string }) {
  // Local / storefront: publicá
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5 5.2 5.3A1.5 1.5 0 0 1 6.6 4.2h10.8a1.5 1.5 0 0 1 1.4 1.1L20 9.5" />
      <path d="M4 9.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5.5 12v6.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V12" />
      <path d="M10 20v-4h4v4" />
    </svg>
  );
}

export function IconDifundir({ className = "" }: { className?: string }) {
  // Megáfono: difundí y vendé
  return (
    <svg {...base} className={className}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
      <path d="M7 15v3.5" />
    </svg>
  );
}
