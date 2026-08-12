import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { acentoPara } from "@/lib/flyerTheme";
import { fmtUSD } from "@/lib/formato";
import { baseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Flyer full-bleed, diseño CLARO. La captura a PNG la hace /api/flyer/[id].
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

  const url = `${baseUrl()}/empresa/${p.codigo}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0B1C2E", light: "#ffffff" } });

  const accent = acentoPara(p.familia);
  const anon = p.nivelPrivacidad === "ANONIMA";
  const ubic = anon ? p.provincia ?? "" : [p.localidad, p.provincia].filter(Boolean).join(", ");
  const highlights = (Array.isArray(p.highlights) ? (p.highlights as string[]) : []).slice(0, 4);
  const W = 1080;
  const H = formato === "story" ? 1920 : 1080;
  const INK = "#132033";

  return (
    <div
      id="flyer"
      style={{
        width: W, height: H, background: "#ffffff", color: INK,
        display: "flex", flexDirection: "column",
        fontFamily: "system-ui, sans-serif", boxSizing: "border-box", position: "relative",
      }}
    >
      {/* Franja de color superior */}
      <div style={{ height: 14, background: accent }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        {/* Header */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg viewBox="0 0 62 60" width={48} height={48} fill="none">
                <path d="M23 50 L23 16 L51 46 L51 13" stroke="#DFE6EC" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 50 L16 16 L44 46 L44 13" stroke="#45B649" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: 34, fontWeight: 800 }}>
                <span style={{ color: "#45B649" }}>Nexo</span><span style={{ color: INK }}>Negocios</span>
              </div>
            </div>
            <div style={{ background: accent, color: "#fff", padding: "10px 24px", borderRadius: 999, fontWeight: 800, fontSize: 28 }}>
              EN VENTA
            </div>
          </div>

          <div style={{ fontSize: formato === "story" ? 78 : 60, fontWeight: 800, lineHeight: 1.05, marginTop: 40, color: INK }}>
            {p.titulo}
          </div>
          {ubic && <div style={{ fontSize: 36, color: "#607083", marginTop: 14 }}>📍 {ubic}</div>}

          {p.fotos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.fotos[0]} alt="" style={{ width: "100%", height: formato === "story" ? 560 : 340, objectFit: "cover", borderRadius: 24, marginTop: 40 }} />
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 40 }}>
            {highlights.map((hl, i) => (
              <span key={i} style={{ background: `${accent}1A`, color: INK, padding: "14px 26px", borderRadius: 999, fontSize: 30, fontWeight: 600 }}>
                ✓ {hl}
              </span>
            ))}
          </div>
        </div>

        {/* Precio + footer */}
        <div>
          <div style={{ display: "flex", gap: 56, alignItems: "flex-end", marginTop: 40 }}>
            <div>
              <div style={{ fontSize: 28, color: "#607083" }}>Precio</div>
              <div style={{ fontSize: 68, fontWeight: 800, color: accent }}>{fmtUSD(p.precioPublicacion)}</div>
            </div>
            {p.facturacionPublica && (
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontSize: 28, color: "#607083" }}>Facturación anual</div>
                <div style={{ fontSize: 44, fontWeight: 700, color: INK }}>{p.facturacionPublica}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 48, borderTop: "2px solid #EAF2FB", paddingTop: 28 }}>
            <div style={{ maxWidth: 640 }}>
              {p.selloExistencia && (
                <div style={{ fontSize: 26, color: "#2F8F38", fontWeight: 700, marginBottom: 12 }}>🛡 Negocio real · Existencia verificada</div>
              )}
              <div style={{ fontSize: 34, fontWeight: 800, color: INK }}>Más info y contacto →</div>
              <div style={{ fontSize: 26, color: accent, marginTop: 6, fontWeight: 600 }}>{url.replace(/^https?:\/\//, "")}</div>
              <div style={{ fontSize: 18, color: "#9aa7b4", marginTop: 16 }}>Información provista por el propietario.</div>
            </div>
            <div style={{ border: `4px solid ${accent}`, padding: 12, borderRadius: 20, width: 190, height: 190 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>
        </div>
      </div>
    </div>
  );
}
