# @nexodirecto/engine — Motor de Valuación

Módulo **puro y determinístico** que calcula la orientación de valuación de NexoDirecto.
Implementa la lógica de [`docs/04-motor-valuacion.md`](../docs/04-motor-valuacion.md). Sin dependencias de framework: se puede montar en la app (Next.js) como librería.

## Uso
```ts
import { valuar, type EngineInput } from "@nexodirecto/engine";

const input: EngineInput = { /* datos del formulario, montos anuales */ };
const resultado = valuar(input); // EngineResult (USD + ARS, rango, escenarios, DCF, drivers)
```

## Comandos
```bash
npm install
npm test          # corre la suite (vitest)
npm run typecheck # tsc --noEmit
```

## Diseño
- **Determinístico:** sin `Date.now()` ni `Math.random()`. Mismos inputs + misma versión de parámetros ⇒ mismo resultado (requisito de auditoría).
- **Ancla en USD:** convierte todo con `tcRef` (ARS por USD); muestra USD y ARS.
- **3 métodos triangulados:** múltiplos (primario) + DCF simplificado (secundario) + activos (piso).
- **Guardas anti-error:** clamps de múltiplo/tasa, piso por activos, nunca valor negativo, sin NaN/Infinity.
- **Parámetros configurables:** `src/params.ts` (valores de arranque **a calibrar**; en producción vienen de la tabla `ParametrosMotor` versionada).

## Estructura
```
src/
├── types.ts       # contrato de entrada/salida
├── params.ts      # parámetros por defecto (v1.0.0) por familia de múltiplo
├── normalize.ts   # normalización a USD
├── earnings.ts    # SDE / EBITDA normalizado
├── size.ts        # clasificación por tamaño
├── multiples.ts   # método de múltiplos + ajustes por riesgo
├── dcf.ts         # flujo de fondos descontado + tasa (build-up)
├── assets.ts      # valor por activos netos
├── engine.ts      # orquestador (pipeline §4.18) + escenarios + incertidumbre
└── index.ts       # API pública
test/              # 32 tests: earnings, tamaño/múltiplos, engine e2e, determinismo, guardas
```

## Pendiente de calibración
Múltiplos por familia, componentes de la tasa, `tcRef` operativo (ver `docs/04 §4.16`).
Posible mejora a evaluar: **pasivo laboral** (indemnizaciones) como deducción en el puente a equity.
