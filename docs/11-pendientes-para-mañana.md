# 11 · Pendientes de configuración (tu parte) — paso a paso

Todo lo que quedó del lado tuyo. Ordenado por prioridad. Nada de esto es código: son
datos, cuentas y variables de entorno. Cuando termines, avisame y seguimos.

---

## 🔴 1. Completar los datos legales (10 min) + revisión de abogado

Las páginas `/terminos` y `/privacidad` ya existen pero tienen **placeholders**.

1. Editá el archivo `web/lib/legal.ts` (o pedime que lo edite con los datos que me pases) y completá:
   - `razonSocial` → tu razón social
   - `cuit` → tu CUIT
   - `domicilio` → domicilio legal
   - `email` → confirmá `contacto@nexonegocios.com.ar` o el que uses para atención al consumidor
   - `jurisdiccion` → p. ej. "los tribunales ordinarios de la Ciudad de Córdoba"
2. **Importante:** los textos de T&C y Privacidad son **borradores**. Hacelos revisar por un/a
   **abogado/a** especializado/a en protección de datos (Ley 25.326) y defensa del consumidor
   (Ley 24.240). Yo dejé la estructura y los puntos clave; el abogado ajusta la redacción.
3. Trámite aparte (administrativo, no urgente para el código): **inscribir la base de datos**
   ante la AAIP (Ley 25.326).

---

## 🔴 2. Backups de la base de datos

### 2a. Backup nativo de Railway (primario)
1. Railway → servicio **Postgres** → pestaña **Backups**.
2. Activá **backups automáticos** (diarios).
3. Hacé un **restore de prueba** a una base temporal para confirmar que funciona.
   (Un backup sin restore probado no cuenta como backup.)

### 2b. Backup independiente a R2 (respaldo — ya programado en el repo)
El GitHub Action `.github/workflows/db-backup.yml` sube un dump diario a R2. Faltan los secrets:
1. GitHub → tu repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Cargá estos 5:
   | Secret | Valor |
   |---|---|
   | `DATABASE_URL` | Connection string **pública** del Postgres (Railway → Postgres → Connect → *Public Network*) |
   | `S3_ENDPOINT` | `https://7a831c8b5b174e95aea1c69567b033d8.r2.cloudflarestorage.com` |
   | `S3_BUCKET` | `nexodirecto` |
   | `S3_ACCESS_KEY` | Access Key de R2 (usá la nueva, ver punto 3) |
   | `S3_SECRET_KEY` | Secret Key de R2 (usá la nueva, ver punto 3) |
3. Probalo a mano: GitHub → **Actions** → "Backup diario de la base" → **Run workflow**.
4. (Opcional) En Cloudflare R2, regla de **lifecycle** para borrar backups de más de 30 días.

---

## 🔴 3. Rotar el Secret Key de R2 (quedó expuesto en el chat)

1. Cloudflare → R2 → **Manage R2 API Tokens** → borrá el token actual → **Create API token**
   (Object Read & Write, bucket `nexodirecto`).
2. Actualizá `S3_ACCESS_KEY` y `S3_SECRET_KEY` en **dos lugares**:
   - Railway (servicio de la app → Variables)
   - GitHub Secrets (punto 2b)

---

## 🟠 4. Variables de entorno en Railway (servicio de la app)

| Variable | Para qué | Cómo obtenerla |
|---|---|---|
| `MP_WEBHOOK_SECRET` | Activa la validación de firma del webhook de Mercado Pago | Panel de Mercado Pago → tus integraciones → Webhooks → clave secreta |
| `TC_REF_DEFAULT` | Piso del tipo de cambio si dolarapi se cae antes de cachear un valor | Poné el MEP actual aproximado (ej. el valor de hoy) |

Ambas son opcionales (la app funciona sin ellas) pero recomendadas para producción.

---

## 🟡 5. (Cuando quieras) Cablear el cron de vencimientos

Hoy las publicaciones no vencen solas porque falta disparar el cron diario.
- Opción simple: **GitHub Actions** con schedule que haga un GET a
  `https://<tu-dominio>/api/cron/vencimientos` con el header `x-cron-secret: <CRON_SECRET>`.
- Necesitás setear `CRON_SECRET` en Railway y usar el mismo valor en el disparador.
- Decime y te dejo el workflow listo, igual que el de backups.

---

## Referencia: qué quedó hecho del lado del código

- Auditoría completa (`docs/10-auditoria-prelanzamiento.md`).
- Lote A (seguridad/pago), Lote B (robustez), Lote C (UX/mobile), Lote D (legal) — desplegados.

## Referencia: qué sigue pendiente en código (para próximas sesiones)

- Infra: sacar `migrate deploy` del arranque del contenedor (release step).
- Observabilidad: Sentry (monitoreo de errores) + analítica (GA4/Plausible) — requieren tus cuentas.
- SEO: `noindex` en páginas privadas, structured data (JSON-LD), favicon/OG default.
- Ecosistema: API pública + plugin de WordPress + subdominio nexodirecto.nexonegocios.com.ar.
- (Opcional) Reset de contraseña + recibo por email (requiere configurar Resend).
