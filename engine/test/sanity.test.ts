import { describe, it, expect } from "vitest";
import { valuar } from "../src/engine.js";
import { makeInput } from "./fixtures.js";
import type { EngineInput } from "../src/types.js";

// Sanity check pre-lanzamiento: casos realistas de PyMEs argentinas (montos ANUALES
// en ARS, TC 1500). Imprime los ratios clave para revisar a ojo que las valuaciones
// tengan lógica, y verifica bandas amplias de cordura.
const TC = 1500;

type Caso = { nombre: string; in: EngineInput };
const M = (m: number) => m * 1_000_000;

const casos: Caso[] = [
  {
    nombre: "Kiosco de barrio",
    in: makeInput({
      familia: "comercio_minorista", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 6, empleados: 1, duenosTrabajan: 1,
      ventasAnual: M(96), cogsModo: "pct", cogsPct: 75, gastosFijosAnual: M(15.6),
      retiroDuenosAnual: M(14.4), sueldoMercadoDuenoAnual: M(9.6), gastosPersonalesAnual: 0,
      inventario: M(8), inventarioMinimo: M(6), equipamiento: M(3), porCobrar: 0, porPagar: M(2),
      tendencia: "estable", dependenciaDueno: "alta", recurrencia: false,
    }),
  },
  {
    nombre: "Restaurante",
    in: makeInput({
      familia: "gastronomia", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 8, empleados: 8, duenosTrabajan: 1,
      ventasAnual: M(180), cogsModo: "pct", cogsPct: 35, gastosFijosAnual: M(90),
      retiroDuenosAnual: M(24), sueldoMercadoDuenoAnual: M(18), equipamiento: M(20), inventario: M(6), inventarioMinimo: M(5),
      tendencia: "estable", dependenciaDueno: "media", recurrencia: false,
    }),
  },
  {
    nombre: "Estudio contable",
    in: makeInput({
      familia: "servicios_profesionales", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 12, empleados: 3, duenosTrabajan: 1,
      ventasAnual: M(72), cogsModo: "pct", cogsPct: 8, gastosFijosAnual: M(24),
      retiroDuenosAnual: M(30), sueldoMercadoDuenoAnual: M(24), equipamiento: M(3),
      tendencia: "estable", dependenciaDueno: "alta", recurrencia: true,
    }),
  },
  {
    nombre: "Fábrica mediana",
    in: makeInput({
      familia: "industria_manufactura", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 20, empleados: 25, duenosTrabajan: 2,
      ventasAnual: M(720), cogsModo: "pct", cogsPct: 55, gastosFijosAnual: M(180),
      retiroDuenosAnual: M(60), sueldoMercadoDuenoAnual: M(48), equipamiento: M(150), inventario: M(60), inventarioMinimo: M(45),
      tendencia: "crece", crecimientoPct: 5, dependenciaDueno: "baja", recurrencia: false,
    }),
  },
  {
    nombre: "Distribuidora mayorista",
    in: makeInput({
      familia: "mayorista_distribucion", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 15, empleados: 12, duenosTrabajan: 1,
      ventasAnual: M(960), cogsModo: "pct", cogsPct: 82, gastosFijosAnual: M(80),
      retiroDuenosAnual: M(36), sueldoMercadoDuenoAnual: M(30), equipamiento: M(40), inventario: M(120), inventarioMinimo: M(90),
      tendencia: "estable", dependenciaDueno: "media", recurrencia: false,
    }),
  },
  {
    nombre: "Software / SaaS",
    in: makeInput({
      familia: "tecnologia_digital", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 5, empleados: 6, duenosTrabajan: 2,
      ventasAnual: M(120), cogsModo: "pct", cogsPct: 15, gastosFijosAnual: M(48),
      retiroDuenosAnual: M(24), sueldoMercadoDuenoAnual: M(30), equipamiento: M(2),
      tendencia: "crece", crecimientoPct: 15, dependenciaDueno: "baja", recurrencia: true,
    }),
  },
  {
    nombre: "Peluquería / estética",
    in: makeInput({
      familia: "belleza_estetica_fitness", monedaCarga: "ARS", tcRef: TC, antiguedadAnios: 7, empleados: 2, duenosTrabajan: 1,
      ventasAnual: M(36), cogsModo: "pct", cogsPct: 15, gastosFijosAnual: M(12),
      retiroDuenosAnual: M(12), sueldoMercadoDuenoAnual: M(8), equipamiento: M(4),
      tendencia: "estable", dependenciaDueno: "alta", recurrencia: false,
    }),
  },
];

describe("sanity check — casos realistas", () => {
  it("imprime ratios y verifica bandas de cordura", () => {
    const rows: string[] = [];
    rows.push(
      ["Caso", "clase", "ventasUSD", "SDE", "EBITDA", "mSDE%", "múlt", "valorUSD", "v/ventas", "v/SDE", "preci%"].join(" | "),
    );
    for (const c of casos) {
      const r = valuar(c.in);
      const ventasUsd = c.in.monedaCarga === "ARS" ? c.in.ventasAnual / TC : c.in.ventasAnual;
      const vVentas = ventasUsd > 0 ? (r.valorCentralUSD / ventasUsd).toFixed(2) : "—";
      const vSde = r.sdeUSD > 0 ? (r.valorCentralUSD / r.sdeUSD).toFixed(2) : "—";
      rows.push(
        [
          c.nombre,
          r.claseTamanio,
          Math.round(ventasUsd).toLocaleString("en-US"),
          r.sdeUSD.toLocaleString("en-US"),
          r.ebitdaUSD.toLocaleString("en-US"),
          (r.margenSde * 100).toFixed(0),
          r.multiploFinal.toFixed(2),
          r.valorCentralUSD.toLocaleString("en-US"),
          vVentas,
          vSde,
          String(r.precisionPct),
        ].join(" | "),
      );

      // Bandas de cordura (amplias): negocios rentables valen > 0 y el múltiplo
      // efectivo sobre la base de ganancia queda en un rango razonable de PyME.
      if (!r.flags.noRentable) {
        expect(r.valorCentralUSD).toBeGreaterThan(0);
        const base = r.baseGanancia === "SDE" ? r.sdeUSD : r.ebitdaUSD;
        if (base > 0) {
          const multEfectivo = r.valorCentralUSD / base;
          expect(multEfectivo).toBeGreaterThan(0.8);
          expect(multEfectivo).toBeLessThan(9);
        }
      }
    }
    console.log("\n" + rows.join("\n") + "\n");
  });
});
