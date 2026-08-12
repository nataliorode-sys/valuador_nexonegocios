import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { temaPara } from "@/lib/flyerTheme";
import { fmtUSD } from "@/lib/formato";

export const dynamic = "force-dynamic";

// Página del flyer, full-bleed. La captura a PNG la hace /api/flyer/[id].
export default async function FlyerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { id } = await params;
  const { f } = await searchParams;
  const formato = f === "post" ? "post" : "story";
  const val = await prisma.valuacion.findUnique({ where: { id }, include: { publicacion: true } });
  if (!val || !val.publicacion) notFound();
  const p = val.publicacion;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const url = `${origin}/empresa/${p.codigo}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0B3B6F", light: "#ffffff" } });

  const tema = temaPara(p.familia);
  const anon = p.nivelPrivacidad === "ANONIMA";
  const ubic = anon ? p.provincia ?? "" : [p.localidad, p.provincia].filter(Boolean).join(", ");
  const highlights = (Array.isArray(p.highlights) ? (p.highlights as string[]) : []).slice(0, 4);
  const W = 1080;
  const H = formato === "story" ? 1920 : 1080;

  return (
    <div
      id="flyer"
      style={{
        width: W, height: H, background: tema.bg, color: tema.text,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: 72, fontFamily: "system-ui, sans-serif", boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg viewBox="0 0 62 60" width={54} height={54} fill="none">
            <path d="M23 50 L23 16 L51 46 L51 13" stroke="rgba(255,255,255,0.25)" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 50 L16 16 L44 46 L44 13" stroke="#45B649" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800 }}>
            <span style={{ color: "#45B649" }}>Nexo</span>
            <span style={{ color: "#fff" }}>Negocios</span>
          </div>
        </div>
        <div style={{ background: "#45B649", color: "#062012", padding: "10px 24px", borderRadius: 999, fontWeight: 800, fontSize: 30 }}>
          EN VENTA
        </div>
      </div>

      <div>
        <div style={{ fontSize: formato === "story" ? 84 : 64, fontWeight: 800, lineHeight: 1.05 }}>{p.titulo}</div>
        {ubic && <div style={{ fontSize: 40, opacity: 0.85, marginTop: 16 }}>📍 {ubic}</div>}

        {p.fotos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.fotos[0]} alt="" style={{ width: "100%", height: formato === "story" ? 520 : 320, objectFit: "cover", borderRadius: 24, marginTop: 36 }} />
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 36 }}>
          {highlights.map((hl, i) => (
            <span key={i} style={{ background: tema.chip, padding: "14px 26px", borderRadius: 999, fontSize: 32 }}>✓ {hl}</span>
          ))}
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 48, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 28, opacity: 0.75 }}>Precio</div>
            <div style={{ fontSize: 64, fontWeight: 800, color: tema.accent }}>{fmtUSD(p.precioPublicacion)}</div>
          </div>
          {p.facturacionPublica && (
            <div>
              <div style={{ fontSize: 28, opacity: 0.75 }}>Facturación anual</div>
              <div style={{ fontSize: 44, fontWeight: 700 }}>{p.facturacionPublica}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ maxWidth: 640 }}>
          {p.selloExistencia && (
            <div style={{ fontSize: 28, marginBottom: 16 }}>🛡 Negocio real · Existencia verificada por NexoNegocios</div>
          )}
          <div style={{ fontSize: 34, fontWeight: 700 }}>Más info y contacto →</div>
          <div style={{ fontSize: 26, opacity: 0.8, marginTop: 6 }}>{url.replace(/^https?:\/\//, "")}</div>
          <div style={{ fontSize: 18, opacity: 0.6, marginTop: 20 }}>Información provista por el propietario.</div>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 20, width: 200, height: 200 }}
          dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
    </div>
  );
}
