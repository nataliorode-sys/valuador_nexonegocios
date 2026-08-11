// Graficos en SVG inline (sin dependencias). Componentes de servidor.
import { fmtUSD } from "@/lib/formato";

const NEXO = "#0B3B6F";
const ACCENT = "#1F9D8F";
const SOFT = "#EAF2FB";

/** Barra horizontal del rango de valuacion con marcador central. */
export function RangoBar({
  min,
  central,
  max,
}: {
  min: number;
  central: number;
  max: number;
}) {
  const span = Math.max(1, max - min);
  const pos = ((central - min) / span) * 100;
  return (
    <div className="w-full">
      <div className="relative h-10">
        <div className="absolute top-4 h-2 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${SOFT}, ${ACCENT})` }} />
        <div className="absolute top-2 h-6 w-1 rounded" style={{ left: `${pos}%`, background: NEXO }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{fmtUSD(min)}</span>
        <span className="font-semibold text-nexo">{fmtUSD(central)}</span>
        <span>{fmtUSD(max)}</span>
      </div>
    </div>
  );
}

/** Grafico de barras verticales generico. */
export function BarChart({
  data,
  height = 160,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / (data.length * 1.6);
  const gap = barW * 0.6;
  return (
    <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        const x = i * (barW + gap) + gap;
        return (
          <g key={i}>
            <rect x={x} y={height - 20 - h} width={barW} height={Math.max(0, h)} fill={i === data.length - 1 ? ACCENT : NEXO} rx={0.5} />
          </g>
        );
      })}
    </svg>
  );
}

/** Leyenda simple para el BarChart (labels debajo). */
export function BarLegend({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
      {data.map((d, i) => (
        <span key={i} className="flex-1 text-center">{d.label}</span>
      ))}
    </div>
  );
}

/** Barras +/- de drivers (tornado simplificado). */
export function DriversChart({
  drivers,
}: {
  drivers: { factor: string; efecto: string; detalle: string }[];
}) {
  return (
    <div className="space-y-2">
      {drivers.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 text-right text-xs text-slate-600">{d.factor}</div>
          <div className="relative h-4 flex-1 rounded bg-slate-100">
            <div
              className="absolute top-0 h-4 rounded"
              style={{
                left: d.efecto === "baja" ? "20%" : "50%",
                width: "30%",
                background: d.efecto === "sube" ? ACCENT : d.efecto === "baja" ? "#e0796b" : "#cbd5e1",
              }}
            />
          </div>
          <div className="w-16 text-xs">
            {d.efecto === "sube" ? "↑ sube" : d.efecto === "baja" ? "↓ baja" : "→"}
          </div>
        </div>
      ))}
    </div>
  );
}
