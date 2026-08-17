import { ImageResponse } from "next/og";

// Imagen OG por defecto del sitio (landing, marketplace y páginas sin OG propia).
export const alt = "NexoDirecto — Valuá y vendé tu empresa | NexoNegocios";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #0B1C2E 0%, #15314D 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
          <span style={{ color: "#45B649" }}>Nexo</span>
          <span>Negocios</span>
          <span
            style={{
              marginLeft: 16,
              fontSize: 20,
              fontWeight: 700,
              color: "#45B649",
              border: "2px solid #45B649",
              borderRadius: 8,
              padding: "2px 12px",
            }}
          >
            Directo
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          <span>Valuá y&nbsp;</span>
          <span style={{ color: "#45B649" }}>vendé&nbsp;</span>
          <span>tu empresa</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#AEC0D0", maxWidth: 880 }}>
          Orientación de valuación profesional, publicación en el Marketplace y flyer para difundir.
        </div>
      </div>
    ),
    { ...size },
  );
}
