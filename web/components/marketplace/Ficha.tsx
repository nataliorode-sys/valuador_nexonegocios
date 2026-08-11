import { fmtUSD } from "@/lib/formato";

export interface FichaData {
  titulo: string;
  descripcion: string;
  precioPublicacion: number;
  nivelPrivacidad: string;
  provincia: string | null;
  localidad: string | null;
  antiguedad: number | null;
  facturacionPublica: string | null;
  highlights: unknown;
  fotos: string[];
  selloExistencia: boolean;
  familia: string;
}

// Ficha publica del negocio (S3). Respeta el nivel de privacidad.
export default function Ficha({ p }: { p: FichaData }) {
  const anon = p.nivelPrivacidad === "ANONIMA";
  const ubicacion = anon ? p.provincia ?? "—" : [p.localidad, p.provincia].filter(Boolean).join(", ");
  const highlights = Array.isArray(p.highlights) ? (p.highlights as string[]) : [];

  return (
    <div>
      {/* Galería */}
      {p.fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {p.fotos.slice(0, 6).map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={f} alt="" className="h-28 w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-slate-400">Sin fotos</div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-nexo-accent/10 px-2 py-0.5 text-xs font-medium text-nexo-accent">
          NexoDirecto · contacto directo
        </span>
        {p.selloExistencia && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            🛡 Negocio real · Existencia verificada
          </span>
        )}
      </div>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">{p.titulo}</h1>
      <p className="text-slate-500">{ubicacion}{p.antiguedad ? ` · ${p.antiguedad} años` : ""}</p>

      {highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {highlights.map((h, i) => (
            <span key={i} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">✓ {h}</span>
          ))}
        </div>
      )}

      <p className="mt-4 whitespace-pre-line text-slate-700">{p.descripcion}</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="text-xs text-slate-500">Precio</div>
          <div className="text-xl font-bold text-nexo">{fmtUSD(p.precioPublicacion)}</div>
        </div>
        {p.facturacionPublica && (
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Facturación anual</div>
            <div className="text-xl font-bold text-slate-700">{p.facturacionPublica}</div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        La información fue provista por el propietario y no fue verificada por NexoNegocios.
      </p>
    </div>
  );
}
