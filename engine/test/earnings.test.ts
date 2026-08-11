import { describe, it, expect } from "vitest";
import { normalize } from "../src/normalize.js";
import { computeEarnings } from "../src/earnings.js";
import { makeInput } from "./fixtures.js";

describe("earnings (SDE / EBITDA normalizado)", () => {
  it("calcula SDE y EBITDA con un ejemplo conocido (USD)", () => {
    // ventas 300k, cogs 20% = 60k, gastos fijos 120k => resultado 120k
    // + gastos personales 5k => SDE 125k ; - sueldo mercado 40k => EBITDA 85k
    const n = normalize(makeInput());
    const e = computeEarnings(n);
    expect(e.resultadoOperativoAntesDueno).toBeCloseTo(120_000, 2);
    expect(e.sde).toBeCloseTo(125_000, 2);
    expect(e.ebitda).toBeCloseTo(85_000, 2);
    expect(e.margenSde).toBeCloseTo(125_000 / 300_000, 4);
  });

  it("cogs por monto en vez de porcentaje", () => {
    const n = normalize(makeInput({ cogsModo: "monto", cogsMonto: 90_000, cogsPct: undefined }));
    const e = computeEarnings(n);
    // 300k - 90k - 120k = 90k + 5k personales = 95k
    expect(e.sde).toBeCloseTo(95_000, 2);
  });

  it("convierte de ARS a USD con tcRef", () => {
    const n = normalize(
      makeInput({
        monedaCarga: "ARS",
        tcRef: 1000,
        ventasAnual: 300_000_000, // = 300k USD
        cogsModo: "pct",
        cogsPct: 20,
        gastosFijosAnual: 120_000_000,
        sueldoMercadoDuenoAnual: 40_000_000,
        gastosPersonalesAnual: 5_000_000,
      }),
    );
    const e = computeEarnings(n);
    expect(e.sde).toBeCloseTo(125_000, 1);
    expect(e.ebitda).toBeCloseTo(85_000, 1);
  });

  it("extraordinarios: suma gastos por unica vez y resta ingresos por unica vez", () => {
    const n = normalize(makeInput({ extraordGasto: 10_000, extraordIngreso: 4_000 }));
    const e = computeEarnings(n);
    // SDE base 125k + 10k - 4k = 131k
    expect(e.sde).toBeCloseTo(131_000, 2);
  });
});
