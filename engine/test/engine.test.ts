import { describe, it, expect } from "vitest";
import { valuar } from "../src/engine.js";
import { makeInput } from "./fixtures.js";

describe("valuar() - caso rentable tipico", () => {
  const r = valuar(makeInput());

  it("produce un valor central positivo y un rango que lo contiene", () => {
    expect(r.valorCentralUSD).toBeGreaterThan(0);
    expect(r.rangoMinUSD).toBeLessThanOrEqual(r.valorCentralUSD);
    expect(r.rangoMaxUSD).toBeGreaterThanOrEqual(r.valorCentralUSD);
    expect(r.rangoMinUSD).toBeGreaterThan(0);
  });

  it("escenarios ordenados conservador <= base <= optimista", () => {
    expect(r.escenariosUSD.conservador).toBeLessThanOrEqual(r.escenariosUSD.base);
    expect(r.escenariosUSD.base).toBeLessThanOrEqual(r.escenariosUSD.optimista);
  });

  it("muestra resultado en USD y ARS coherentes con tcRef", () => {
    expect(r.valorCentralARS).toBeCloseTo(r.valorCentralUSD * r.tcRef, -6);
    expect(r.monedaResultado).toBe("USD");
  });

  it("clasifica pequenia con base SDE y aplica DCF (mixto)", () => {
    expect(r.claseTamanio).toBe("pequenia");
    expect(r.baseGanancia).toBe("SDE");
    expect(r.flags.dcfAplicado).toBe(true);
    expect(r.metodoPredominante).toBe("mixto");
    expect(r.tablaDcf).not.toBeNull();
    expect(r.tablaDcf!.length).toBe(5);
  });

  it("el valor de multiplos = base ganancia * multiplo final", () => {
    expect(r.valorMultiplosUSD).toBeCloseTo(r.baseGananciaUSD * r.multiploFinal, -3);
  });
});

describe("valuar() - empresa NO rentable => metodo activos", () => {
  const r = valuar(
    makeInput({
      gastosFijosAnual: 320_000, // supera ventas+cogs => resultado negativo
      gastosPersonalesAnual: 0,
      equipamiento: 40_000,
      inventario: 10_000,
      porCobrar: 5_000,
      porPagar: 3_000,
    }),
  );

  it("marca noRentable y usa activos", () => {
    expect(r.sdeUSD).toBeLessThanOrEqual(0);
    expect(r.flags.noRentable).toBe(true);
    expect(r.metodoPredominante).toBe("activos");
  });

  it("nunca devuelve valor negativo al usuario", () => {
    expect(r.valorCentralUSD).toBeGreaterThanOrEqual(0);
    expect(r.rangoMinUSD).toBeGreaterThanOrEqual(0);
    expect(r.valorMultiplosUSD).toBe(0);
    expect(r.valorDcfUSD).toBeNull();
  });

  it("el valor se acerca a los activos netos", () => {
    // activos: 40k+10k+5k-3k = 52k (deudas no se transfieren)
    expect(r.valorActivosUSD).toBeCloseTo(52_000, -3);
    expect(r.valorCentralUSD).toBeCloseTo(52_000, -3);
  });
});

describe("valuar() - piso por activos en negocio poco rentable", () => {
  it("si los activos superan el valor por rentabilidad, se aplica el piso", () => {
    const r = valuar(
      makeInput({
        gastosFijosAnual: 175_000, // SDE chico
        sueldoMercadoDuenoAnual: 40_000,
        equipamiento: 300_000,
        inmuebleIncluido: true,
        inmuebleValor: 500_000,
      }),
    );
    expect(r.valorCentralUSD).toBeGreaterThanOrEqual(r.valorActivosUSD - 1);
    expect(["activos", "mixto", "multiplos"]).toContain(r.metodoPredominante);
  });
});

describe("valuar() - empresa grande sugiere revision (flag)", () => {
  const r = valuar(
    makeInput({
      ventasAnual: 6_000_000,
      gastosFijosAnual: 3_000_000,
      cogsPct: 40,
      sueldoMercadoDuenoAnual: 120_000,
    }),
  );
  it("clasifica grande y usa base EBITDA", () => {
    expect(r.claseTamanio).toBe("grande");
    expect(r.baseGanancia).toBe("EBITDA");
    expect(r.flags.grande).toBe(true);
  });
});

describe("valuar() - inmueble incluido se suma aparte del negocio", () => {
  it("el valor con inmueble es mayor que sin inmueble", () => {
    const sin = valuar(makeInput());
    const con = valuar(makeInput({ inmuebleIncluido: true, inmuebleValor: 200_000 }));
    expect(con.valorCentralUSD).toBeGreaterThan(sin.valorCentralUSD);
  });
});

describe("valuar() - completitud afecta la precision y el ancho del rango", () => {
  it("menos datos => menor precision y rango relativo mas ancho", () => {
    const completo = valuar(makeInput());
    const minimo = valuar(
      makeInput({
        concentracionClientePct: undefined,
        gastosPersonalesAnual: undefined,
        extraordGasto: undefined,
        inventario: undefined,
        porCobrar: undefined,
        porPagar: undefined,
        equipamiento: undefined,
        deudaFinanciera: undefined,
        crecimientoPct: undefined,
        recurrencia: undefined,
        anioRepresentativo: undefined,
      }),
    );
    expect(minimo.precisionPct).toBeLessThan(completo.precisionPct);
    const anchoRel = (r: { rangoMaxUSD: number; rangoMinUSD: number; valorCentralUSD: number }) =>
      (r.rangoMaxUSD - r.rangoMinUSD) / r.valorCentralUSD;
    expect(anchoRel(minimo)).toBeGreaterThan(anchoRel(completo));
  });
});

describe("valuar() - deudas transferidas reducen el valor", () => {
  it("transferir deuda baja el valor para el duenio", () => {
    const sin = valuar(makeInput({ deudaFinanciera: 50_000, deudaTransfiere: "quedan" }));
    const con = valuar(makeInput({ deudaFinanciera: 50_000, deudaTransfiere: "transfieren" }));
    expect(con.valorCentralUSD).toBeLessThan(sin.valorCentralUSD);
  });
});
