import { describe, it, expect } from "vitest";
import { valuar } from "../src/engine.js";
import { makeInput } from "./fixtures.js";

// Reproduce los dos casos reales que motivaron los flags de datos sospechosos
// (ver revisión de informes ND-000013 supermercado y ND-000018 encuadernado).
describe("flags de datos sospechosos", () => {
  it("gastos > ventas: marca gastosSuperanVentas, baja la precisión y no infla el valor", () => {
    // Un gasto cargado en miles de millones (cero de más): gastos ≫ ventas.
    const r = valuar(
      makeInput({
        monedaCarga: "ARS",
        tcRef: 1540,
        ventasAnual: 600_000_000,
        cogsModo: "monto",
        cogsMonto: 200_000_000,
        gastosFijosAnual: 72_000_000_000, // 6.000M/mes × 12: error de tipeo
        retiroDuenosAnual: 48_000_000,
        sueldoMercadoDuenoAnual: 48_000_000,
        gastosPersonalesAnual: 300_000,
        equipamiento: 0,
        inventario: 0,
        porCobrar: 0,
      }),
    );
    expect(r.flags.gastosSuperanVentas).toBe(true);
    expect(r.flags.noRentable).toBe(true);
    expect(r.precisionPct).toBeLessThanOrEqual(35);
    expect(r.valorCentralUSD).toBe(0);
  });

  it("margen muy por encima del rubro: marca margenSospechoso (costos probablemente incompletos)", () => {
    // Súper con COGS bajo (50%) y pocos gastos fijos → margen SDE atípicamente alto.
    const r = valuar(
      makeInput({
        familia: "comercio_minorista",
        monedaCarga: "ARS",
        tcRef: 1534,
        ventasAnual: 660_000_000,
        cogsModo: "pct",
        cogsPct: 50,
        gastosFijosAnual: 56_000_000,
        retiroDuenosAnual: 24_000_000,
        sueldoMercadoDuenoAnual: 24_000_000,
        gastosPersonalesAnual: 2_000_000,
      }),
    );
    expect(r.flags.gastosSuperanVentas).toBe(false);
    expect(r.flags.margenSospechoso).toBe(true);
    expect(r.precisionPct).toBeLessThanOrEqual(75);
  });

  it("negocio bien cargado: no dispara ninguna alerta de datos", () => {
    const r = valuar(makeInput());
    expect(r.flags.gastosSuperanVentas).toBe(false);
    expect(r.flags.margenSospechoso).toBe(false);
  });
});
