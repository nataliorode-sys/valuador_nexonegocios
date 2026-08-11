import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMS } from "../src/params.js";
import { normalize } from "../src/normalize.js";
import { computeEarnings } from "../src/earnings.js";
import { baseGananciaPara, clasificarTamanio } from "../src/size.js";
import { computeMultiple, rangoMultiplo } from "../src/multiples.js";
import { makeInput } from "./fixtures.js";

describe("clasificacion de tamanio", () => {
  it("umbrales micro/pequenia/mediana/grande", () => {
    const p = DEFAULT_PARAMS;
    expect(clasificarTamanio(100_000, p)).toBe("micro");
    expect(clasificarTamanio(300_000, p)).toBe("pequenia");
    expect(clasificarTamanio(1_500_000, p)).toBe("mediana");
    expect(clasificarTamanio(5_000_000, p)).toBe("grande");
  });

  it("base de ganancia: SDE para chicas, EBITDA para grandes", () => {
    expect(baseGananciaPara("micro")).toBe("SDE");
    expect(baseGananciaPara("pequenia")).toBe("SDE");
    expect(baseGananciaPara("mediana")).toBe("EBITDA");
    expect(baseGananciaPara("grande")).toBe("EBITDA");
  });
});

describe("rango de multiplo", () => {
  it("EBITDA aplica el offset sobre el rango SDE", () => {
    const p = DEFAULT_PARAMS;
    const sde = rangoMultiplo("gastronomia", "SDE", p);
    const ebitda = rangoMultiplo("gastronomia", "EBITDA", p);
    expect(ebitda.base - sde.base).toBeCloseTo(p.ebitdaMultiploOffset, 6);
  });
});

describe("computeMultiple", () => {
  const p = DEFAULT_PARAMS;

  it("el multiplo final queda dentro del rango de la familia (clamp)", () => {
    const input = makeInput({
      tendencia: "crece",
      crecimientoPct: 100, // extremo
      dependenciaDueno: "baja",
      recurrencia: true,
      antiguedadAnios: 30,
    });
    const n = normalize(input);
    const e = computeEarnings(n);
    const r = computeMultiple(n, e, "pequenia", "SDE", p);
    expect(r.multiploFinal).toBeGreaterThanOrEqual(r.rango.min);
    expect(r.multiploFinal).toBeLessThanOrEqual(r.rango.max);
  });

  it("factores negativos bajan el multiplo respecto del base", () => {
    const input = makeInput({
      tendencia: "baja",
      dependenciaDueno: "alta",
      concentracionClientePct: 70,
      antiguedadAnios: 1,
    });
    const n = normalize(input);
    const e = computeEarnings(n);
    const r = computeMultiple(n, e, "pequenia", "SDE", p);
    expect(r.multiploFinal).toBeLessThan(r.multiploBase);
  });

  it("factores positivos suben el multiplo respecto del base", () => {
    const input = makeInput({
      tendencia: "crece",
      dependenciaDueno: "baja",
      recurrencia: true,
      antiguedadAnios: 15,
    });
    const n = normalize(input);
    const e = computeEarnings(n);
    const r = computeMultiple(n, e, "pequenia", "SDE", p);
    expect(r.multiploFinal).toBeGreaterThan(r.multiploBase);
  });
});
