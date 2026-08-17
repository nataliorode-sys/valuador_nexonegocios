import { describe, it, expect } from "vitest";
import { simularPalancas } from "../src/engine.js";
import { makeInput } from "./fixtures.js";

describe("simularPalancas (what-if)", () => {
  it("propone mejoras que suben el valor para un negocio dependiente y sin recurrencia", () => {
    const input = makeInput({
      dependenciaDueno: "alta",
      recurrencia: false,
      concentracionClientePct: 50,
    });
    const { base, palancas } = simularPalancas(input);
    expect(base).toBeGreaterThan(0);
    expect(palancas.length).toBeGreaterThanOrEqual(3);
    // Todas las palancas suben el valor y quedan ordenadas de mayor a menor.
    for (const p of palancas) expect(p.delta).toBeGreaterThan(0);
    for (let i = 1; i < palancas.length; i++) {
      expect(palancas[i - 1]!.delta).toBeGreaterThanOrEqual(palancas[i]!.delta);
    }
    expect(palancas.map((p) => p.clave)).toContain("dependencia");
    expect(palancas.map((p) => p.clave)).toContain("recurrencia");
    expect(palancas.map((p) => p.clave)).toContain("concentracion");
  });

  it("no propone reducir dependencia si ya es baja, ni recurrencia si ya la tiene", () => {
    const input = makeInput({
      dependenciaDueno: "baja",
      recurrencia: true,
      concentracionClientePct: 10,
    });
    const claves = simularPalancas(input).palancas.map((p) => p.clave);
    expect(claves).not.toContain("dependencia");
    expect(claves).not.toContain("recurrencia");
    expect(claves).not.toContain("concentracion");
  });

  it("es determinístico y no muta el input", () => {
    const input = makeInput({ dependenciaDueno: "media" });
    const snap = structuredClone(input);
    const a = simularPalancas(input);
    const b = simularPalancas(input);
    expect(a).toStrictEqual(b);
    expect(input).toStrictEqual(snap);
  });
});
