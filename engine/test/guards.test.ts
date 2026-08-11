import { describe, it, expect } from "vitest";
import { valuar } from "../src/engine.js";
import { normalize } from "../src/normalize.js";
import { annualize, nonNeg } from "../src/util.js";
import { makeInput } from "./fixtures.js";

describe("guardas anti-error (§4.17)", () => {
  it("tcRef invalido (<=0) lanza error claro", () => {
    expect(() => normalize(makeInput({ tcRef: 0 }))).toThrow(/tcRef/);
    expect(() => normalize(makeInput({ tcRef: -5 }))).toThrow(/tcRef/);
  });

  it("montos negativos u opcionales se tratan como 0 (no rompen)", () => {
    const r = valuar(
      makeInput({
        gastosPersonalesAnual: undefined,
        extraordGasto: undefined,
        inventario: undefined,
        equipamiento: undefined,
      }),
    );
    expect(Number.isFinite(r.valorCentralUSD)).toBe(true);
  });

  it("ventas cero no produce NaN ni Infinity", () => {
    const r = valuar(makeInput({ ventasAnual: 0, cogsPct: 0, gastosFijosAnual: 0 }));
    expect(Number.isFinite(r.valorCentralUSD)).toBe(true);
    expect(r.valorCentralUSD).toBeGreaterThanOrEqual(0);
  });

  it("todos los campos numericos del resultado son finitos", () => {
    const r = valuar(makeInput({ familia: "agro", ventasAnual: 900_000 }));
    for (const v of [
      r.valorCentralUSD,
      r.rangoMinUSD,
      r.rangoMaxUSD,
      r.valorCentralARS,
      r.multiploFinal,
      r.sdeUSD,
      r.ebitdaUSD,
    ]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("crecimiento extremo no explota el DCF (topes de g)", () => {
    const r = valuar(makeInput({ tendencia: "crece", crecimientoPct: 999 }));
    expect(Number.isFinite(r.valorDcfUSD ?? 0)).toBe(true);
    expect(r.valorCentralUSD).toBeLessThan(1e12);
  });

  it("util: annualize y nonNeg", () => {
    expect(annualize(100, "mensual")).toBe(1200);
    expect(annualize(100, "anual")).toBe(100);
    expect(nonNeg(-5)).toBe(0);
    expect(nonNeg(undefined)).toBe(0);
    expect(nonNeg(NaN)).toBe(0);
    expect(nonNeg(42)).toBe(42);
  });
});
