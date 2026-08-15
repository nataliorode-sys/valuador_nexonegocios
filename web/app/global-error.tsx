"use client";

// Boundary de último recurso (reemplaza el layout raíz si el propio layout falla).
// Debe incluir <html> y <body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-AR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F5F7F9", color: "#132033" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>😕</div>
          <h1 style={{ marginTop: 16, fontSize: 24, fontWeight: 700, color: "#0B1C2E" }}>Algo salió mal</h1>
          <p style={{ marginTop: 8, color: "#607083" }}>
            Tuvimos un problema inesperado. Probá de nuevo en unos segundos.
          </p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 24, borderRadius: 8, background: "#15314D", color: "#fff", border: 0, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
