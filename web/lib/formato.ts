// Formateo de moneda es-AR.
export function fmtUSD(v: number): string {
  return "USD " + v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function fmtARS(v: number): string {
  return "$ " + v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}
