"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-nexo px-5 py-2.5 text-sm font-semibold text-white hover:bg-nexo-dark"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
