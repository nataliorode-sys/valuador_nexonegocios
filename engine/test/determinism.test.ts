import { describe, it, expect } from "vitest";
import { valuar } from "../src/engine.js";
import { makeInput } from "./fixtures.js";

describe("determinismo (requisito de auditoria §8.7)", () => {
  it("mismos inputs + misma version => resultado identico", () => {
    const input = makeInput({
      familia: "industria_manufactura",
      ventasAnual: 1_200_000,
      cogsPct: 45,
      gastosFijosAnual: 400_000,
      inventario: 150_000,
      equipamiento: 300_000,
    });
    const a = valuar(input);
    const b = valuar(input);
    expect(a).toStrictEqual(b);
  });

  it("no muta el input recibido", () => {
    const input = makeInput();
    const snapshot = structuredClone(input);
    valuar(input);
    expect(input).toStrictEqual(snapshot);
  });

  it("sella la version de parametros del motor", () => {
    const r = valuar(makeInput());
    expect(r.engineVersion).toBe("1.0.0");
  });
});
