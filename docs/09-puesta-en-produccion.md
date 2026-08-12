# Etapa 9 — Puesta en Producción — NexoDirecto

Guía práctica para dejar la app online, con URL pública, pagos reales y emails.
Pensada para que la siga vos o un desarrollador. Estado del código: completo y
probado end-to-end; sólo requiere configuración de infraestructura y credenciales.

---

## 9.0 Decisión de stack (leer primero)

La app tiene dos particularidades que condicionan dónde conviene deployarla:

1. **Genera PDF e imágenes (flyer) con Chromium** (headless, vía `playwright-core`).
2. **Guarda fotos** — hoy en **disco local** (abstracción en `web/lib/storage.ts`).

Por eso hay dos caminos:

| | **Opción A — Contenedor (recomendada)** | **Opción B — Vercel** |
|---|---|---|
| Hosts | Railway · Render · Fly.io | Vercel |
| Chromium | Se instala en el build (`playwright install`) | Requiere `@sparticuz/chromium` (cambio de código) |
| Fotos | Disco con **volumen persistente**, o S3/R2 | **Obligatorio S3/R2** (no hay disco persistente) |
| Fricción | **Baja** (así se construyó) | Media (2 cambios de código) |
| Recomendación | ✅ para empezar | Válida si ya usás Vercel |

**Recomendación: Opción A (Railway o Render)** + **Postgres gestionado** (Neon/Supabase/el del host) + **Cloudflare R2 o S3** para fotos (recomendado incluso en contenedor, para no depender del disco).

> Cambio de código pendiente para producción real: implementar S3/R2 en `storage.ts` (hoy es disco). Ver §9.4. Es un archivo. Podés pedírmelo y lo dejo listo.

---

## 9.1 Pre-requisitos
- Cuenta en el host elegido (Railway/Render).
- Base **PostgreSQL** (gestionada).
- **Credenciales Mercado Pago** (ya las tenés): Access Token + Public Key.
- Cuenta **Resend** (emails) con un dominio verificado.
- Bucket **S3/R2** (fotos) — o volumen persistente si empezás con disco.
- Un **dominio** (ej. `directo.nexonegocios.com`) — opcional al inicio, se puede usar el subdominio del host.

---

## 9.2 Variables de entorno (completas)

| Variable | Obligatoria | Qué es |
|----------|:---:|--------|
| `DATABASE_URL` | ✅ | Cadena de conexión a PostgreSQL de producción |
| `AUTH_SECRET` | ✅ | Secreto de Auth.js. Generar: `openssl rand -hex 32` |
| `APP_BASE_URL` | ✅ | URL pública completa, ej. `https://directo.nexonegocios.com` (back_urls MP, OG, sitemap, emails) |
| `TC_REF_DEFAULT` | ✅ | Tipo de cambio ARS/USD por defecto (ej. `1200`). Idealmente actualizar periódicamente |
| `MP_ACCESS_TOKEN` | ✅ (para cobrar) | Access Token de Mercado Pago (empezar con `TEST-...`) |
| `MP_PUBLIC_KEY` | ○ | Public Key de MP (reservado para checkout embebido futuro) |
| `RESEND_API_KEY` | ✅ (para emails) | API key de Resend |
| `EMAIL_FROM` | ✅ (para emails) | Remitente verificado, ej. `NexoNegocios <no-reply@nexonegocios.com>` |
| `CRON_SECRET` | ✅ (para el cron) | Secreto para autorizar `/api/cron/vencimientos` |
| `S3_ENDPOINT` `S3_BUCKET` `S3_ACCESS_KEY` `S3_SECRET_KEY` | ✅ (con S3) | Credenciales del bucket (una vez implementado S3 en storage.ts) |
| `UPLOAD_DIR` | ○ | Directorio de fotos si se usa disco (default `web/uploads`) |
| `PLAYWRIGHT_BROWSERS_PATH` | ○ | Dónde queda Chromium tras `playwright install` (ver §9.5) |
| `PLAYWRIGHT_CHROMIUM_PATH` | ○ | Ruta directa al ejecutable de Chromium (alternativa a la anterior) |

> Nunca commitear valores reales. Se cargan en el panel del host. `.env` está en `.gitignore`.

---

## 9.3 Base de datos
1. Crear la base en el proveedor y copiar la `DATABASE_URL`.
2. Aplicar el esquema (migraciones ya versionadas en `web/prisma/migrations`):
   ```bash
   cd web
   DATABASE_URL="...prod..." npx prisma migrate deploy
   ```
   Ejecutar esto en cada release (paso de "release" del host, o manual la primera vez).
3. Crear el usuario **admin** (para moderar):
   ```bash
   cd web
   DATABASE_URL="...prod..." ADMIN_EMAIL="vos@nexonegocios.com" ADMIN_PASSWORD="una-clave-fuerte" node scripts/seed-admin.mjs
   ```
   (O marcar `rol = 'ADMIN'` a mano en la tabla `User`.)

---

## 9.4 Almacenamiento de fotos (R2/S3) — ya implementado ✅
`web/lib/storage.ts` soporta **Cloudflare R2 / S3** y disco, según el entorno:
- Si están seteadas `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` → usa R2/S3.
- Si no → usa disco (`UPLOAD_DIR`), ideal para desarrollo.

**Configurar Cloudflare R2:**
1. Crear un bucket en R2 (ej. `nexodirecto`).
2. Crear un **API Token** de R2 (Access Key ID + Secret) con permiso de lectura/escritura al bucket.
3. Setear variables:
   - `S3_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_BUCKET` = `nexodirecto`
   - `S3_ACCESS_KEY` / `S3_SECRET_KEY` = las del token
   - `S3_REGION` = `auto`
   - `S3_PUBLIC_URL` (opcional) = si activás **acceso público** del bucket o un dominio propio
     (ej. `https://cdn.nexonegocios.com`), las fotos se sirven directo desde ahí (más rápido).
     Si no lo seteás, se sirven vía `/api/media/...` (funciona igual, con un fetch extra).

Sin `S3_PUBLIC_URL`, no hace falta hacer público el bucket (más seguro). Con él, ganás performance/CDN.

---

## 9.5 Chromium para PDF y flyer
La generación usa `playwright-core`, que **no trae** el navegador. Según el host:

**Contenedor (Opción A):** instalar Chromium en el build y decirle dónde está.
```bash
# en el build:
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright install --with-deps chromium
```
Y setear en el entorno `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. El código
(`web/lib/chromium.ts`) autodetecta `/opt/pw-browsers/chromium-<rev>/chrome-linux/chrome`.
(`--with-deps` instala librerías del sistema; requiere permisos de root en el build, disponibles en Docker/Render/Railway.)

**Vercel (Opción B):** reemplazar el navegador por **`@sparticuz/chromium`** + `playwright-core`,
usando su `executablePath`. Es un cambio acotado en `web/lib/chromium.ts`. Pedímelo y lo adapto.

---

## 9.6 Mercado Pago
1. Empezar con credenciales **de prueba** (`TEST-...`) en `MP_ACCESS_TOKEN`.
2. Setear `APP_BASE_URL` a la URL pública (MP usa las `back_urls` y el webhook `${APP_BASE_URL}/api/mp/webhook`).
3. En el panel de MP → tu app → **Webhooks/Notificaciones**, configurar la URL:
   `https://<tu-dominio>/api/mp/webhook` (evento: pagos).
4. Probar con **usuarios y tarjetas de prueba** de MP (comprador de test). El flujo:
   pago → retorno verifica contra la API → desbloquea; el webhook confirma en paralelo.
5. Cuando funcione, cambiar a credenciales **de producción** (`APP_USR-...`).

> El código ya verifica el pago contra la API de MP (no confía en la URL de retorno) y es idempotente.

---

## 9.7 Emails (Resend)
1. Crear cuenta en resend.com, **verificar el dominio** (registros DNS que te da Resend).
2. Setear `RESEND_API_KEY` y `EMAIL_FROM` (con el dominio verificado).
3. Sin estas variables, los emails se loguean (no se envían) — útil en staging.

---

## 9.8 Cron de vencimientos
El endpoint `GET /api/cron/vencimientos?secret=$CRON_SECRET` avisa a los 90/99 días y
marca vencidas. Programarlo **1 vez por día**:
- **Vercel:** `vercel.json` con `crons` apuntando a esa ruta (agregar el header/secret).
- **Railway/Render/otros:** un cron externo (cron-job.org, Render Cron Job, GitHub Actions
  schedule) que haga `curl "https://<dominio>/api/cron/vencimientos?secret=..."` diariamente.

---

## 9.9 Deploy paso a paso — Opción A (Railway/Render)
1. Conectar el repo de GitHub al host; seleccionar la app (monorepo: root, o `web` como raíz del servicio).
2. **Build command:** `npm install && cd web && npx prisma generate && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright install --with-deps chromium && npm run build`
3. **Start command:** `cd web && npx prisma migrate deploy && npm run start`
4. Cargar **todas las variables** de §9.2 en el panel del host.
5. Provisionar **Postgres** gestionado y pegar su `DATABASE_URL`.
6. Deploy. Cuando esté verde, correr el **seed admin** (§9.3) una vez.
7. Configurar el **webhook de MP** y el **cron** (§9.6, §9.8).

## 9.10 Deploy — Opción B (Vercel), resumen
1. Importar el repo; root del proyecto = `web` (o configurar monorepo).
2. Aplicar los 2 cambios de código: **S3/R2** en storage (§9.4) y **@sparticuz/chromium** (§9.5).
3. Variables de entorno (§9.2) en Vercel; `DATABASE_URL` a Neon/Supabase.
4. `prisma migrate deploy` como paso de build o desde local contra prod.
5. `vercel.json` con el cron. Webhook MP igual que en A.

---

## 9.11 Dominio y HTTPS
- Apuntar el subdominio (ej. `directo.nexonegocios.com`) al host (CNAME/registro que indique el host).
- HTTPS lo maneja el host automáticamente (Let's Encrypt).
- Setear `APP_BASE_URL` al dominio final **antes** de configurar MP y emails.

---

## 9.12 Checklist de seguridad (antes de abrir al público)
- [ ] `AUTH_SECRET` fuerte y único en producción.
- [ ] Usuario admin creado con contraseña fuerte; `/admin` sólo accesible con rol ADMIN (ya implementado).
- [ ] `CRON_SECRET` seteado (el endpoint de cron rechaza sin él).
- [ ] Revisar textos legales (disclaimer, términos, privacidad) con un abogado.
- [ ] **Pendiente recomendado:** rate-limiting en login y en el formulario de contacto (anti-abuso). No implementado aún; se puede agregar con un middleware o un servicio (Upstash Ratelimit).
- [ ] Backups automáticos de la base activados en el proveedor.

---

## 9.13 Smoke test post-deploy (5 minutos)
1. Registrarse, completar el wizard, llegar al teaser (valor oculto).
2. Pagar con tarjeta de prueba de MP → ver el resultado desbloqueado.
3. Descargar el **informe PDF** (verifica que Chromium funciona en el host).
4. Armar la publicación con una **foto** (verifica el almacenamiento).
5. Aprobar desde `/admin/moderacion` (con el usuario admin).
6. Ver la ficha pública, enviar una consulta → verificar que llega el **email** al vendedor.
7. Descargar el **flyer**; abrir `/sitemap.xml` y `/robots.txt`.
8. Compartir el link de una ficha en WhatsApp → verificar el preview (Open Graph).

---

## 9.14 Pendientes de negocio (no bloquean el deploy)
- **Calibrar los múltiplos** por familia con datos reales de operaciones (`04-motor-valuacion.md §4.16`).
- **Completar el anexo de rubros** (`anexo-rubros.md`).
- Definir política de **actualización del tipo de cambio** (`TC_REF_DEFAULT`).
- Textos legales definitivos.

---

## 9.15 Costos aproximados para empezar (orden de magnitud, USD/mes)
- Host de la app (Railway/Render, plan chico): ~5–20
- Postgres gestionado (Neon/Supabase free/entry): 0–20
- R2/S3 (fotos, volumen bajo): ~0–5
- Resend (free tier hasta cierto volumen): 0
- Mercado Pago: sin costo fijo (comisión por transacción)
- Dominio: ~10–15/año

> Se puede empezar prácticamente en el tramo gratuito/bajo y escalar según volumen.
