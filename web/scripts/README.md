# Scripts

## `e2e.mjs` — prueba end-to-end del flujo completo
Recorre con un navegador real: elegibilidad → wizard (7 pasos) → cálculo → teaser
→ pago (mock) → resultado completo → descarga de PDF. Verifica persistencia en Postgres.

Requiere:
1. Postgres corriendo y `web/.env` con `DATABASE_URL` (migraciones aplicadas: `npx prisma migrate dev`).
2. El server dev arriba: `npm run dev` (puerto 3000).
3. Chromium disponible (usa `/opt/pw-browsers/chromium-*/chrome-linux/chrome`).

Correr:
```bash
node scripts/e2e.mjs
```
