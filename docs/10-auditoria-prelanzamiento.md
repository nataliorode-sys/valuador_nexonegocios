# 10 · Auditoría integral pre-lanzamiento

Revisión sistemática de NexoDirecto antes de salir a clientes reales. Seis dimensiones
auditadas en modo lectura: seguridad, pagos, confiabilidad/infra, legal (AR), UX/accesibilidad
y SEO/observabilidad. Cada hallazgo indica severidad, archivo y recomendación.

> Nota legal: la sección legal identifica brechas técnicas y de contenido; **no reemplaza el
> dictamen de un abogado matriculado** en protección de datos (Ley 25.326) y defensa del
> consumidor (Ley 24.240 / CCyC).

---

## Semáforo de lanzamiento

| Estado | Significado |
|---|---|
| 🔴 Bloqueante | No lanzar a clientes reales sin resolver |
| 🟠 Alto | Resolver en los primeros días / antes de campañas |
| 🟡 Medio | Mejora importante, no bloquea |
| ⚪ Bajo | Pulido / post-lanzamiento |

---

## 🔴 Bloqueantes

### B1 · Se puede obtener el producto sin pagar (pago simulado invocable en prod)
`web/app/valuar/actions.ts:163` · `web/app/valuar/[id]/pago/page.tsx`
`pagarMock` es una server action que se bindea siempre; la UI solo oculta el botón. Un dueño
puede invocarla por POST sobre su propia valuación (pasa `assertOwner`) y quedar en `PAGA` sin
pagar. **Fix:** abortar en `pagarMock` si `mpHabilitado() || NODE_ENV === "production"`.

### B2 · Fail-open: si falta `MP_ACCESS_TOKEN`, la app cae al pago simulado
`web/lib/mercadopago.ts:8` · `web/app/valuar/[id]/pago/page.tsx`
`mpHabilitado()` solo chequea presencia de la variable. Si en prod falta/expira, se renderiza el
botón "Pagar (simulado)" y **todos** desbloquean gratis. **Fix:** en producción, la ausencia del
token debe fallar cerrado (error en la página de pago), nunca caer al mock.

### B3 · Se saltea la moderación: las publicaciones nacen PUBLICADAS
`web/prisma/schema.prisma:211` · `web/app/valuar/[id]/publicar/actions.ts` · `web/app/admin/moderacion/actions.ts:47`
`Publicacion.estadoPub` tiene default `PUBLICADA`; `guardarPublicacion` no lo cambia → la ficha es
visible por URL directa antes de moderar. Además `rechazarPublicacion` no cambia `estadoPub`, así
que una publicación **rechazada sigue pública**. El `codigo` es enumerable (`ND-2026-000001…`).
**Fix:** default no público; solo `aprobar` la pone `PUBLICADA`; `rechazar` la pone `RECHAZADA`; y
`/empresa/[codigo]` debe exigir `estadoPub === "PUBLICADA"` **y** `fechaVencimiento > now`.

### B4 · El "reembolso" al rechazar no devuelve la plata
`web/app/admin/moderacion/actions.ts:55` · `web/lib/mercadopago.ts`
Al rechazar solo se marca `Pago = REEMBOLSADO` en la base; **no hay llamada a la API de refunds de
MP**. El cliente fue cobrado $150.000 y nunca recibe el reintegro. Riesgo de contracargos y legal.
**Fix:** implementar el refund real (`POST /v1/payments/{id}/refunds`) y marcar `REEMBOLSADO` solo
cuando MP confirme; manejar refund fallido.

### B5 · Sin Términos y Condiciones ni Política de Privacidad
No existen páginas legales en toda la app. Se recolectan datos personales y económicos sensibles,
y se cobra, sin marco contractual ni base legal (Ley 25.326 arts. 5, 6; deber de información).
Los disclaimers de la valuación están bien redactados pero no son contractualmente vinculantes.
**Fix:** crear `/terminos` y `/privacidad` (borrador nuestro + revisión de abogado), enlazadas en
footer y formularios.

### B6 · Leads (datos de terceros) sin consentimiento ni aviso de cesión
`web/components/marketplace/ContactForm.tsx` · `web/app/empresa/[codigo]/actions.ts`
El comprador carga nombre/email/teléfono y se ceden al vendedor con solo una micro-nota. Es el
punto de mayor exposición porque afecta a terceros ajenos al contrato (Ley 25.326 arts. 5, 6, 11).
**Fix:** checkbox de consentimiento explícito con link a privacidad e información de la cesión.

### B7 · Sin backups verificables de la base
`docs/09` (checklist sin marcar)
La base guarda datos de clientes que pagaron; `onDelete: Cascade` en toda la jerarquía. Un borrado
o incidente del proveedor = pérdida total irrecuperable. **Fix:** activar backups automáticos de
Railway **+** `pg_dump` diario independiente a R2, y **probar un restore** antes de lanzar.

---

## 🟠 Altos

### A1 · Informe (PDF y HTML) sin verificación de dueño — fuga de datos financieros
`web/app/api/informe/[id]/pdf/route.ts` · `web/app/valuar/[id]/informe/page.tsx`
No hay `assertOwner`: cualquiera con el `id` (UUID) accede al informe completo (SDE, EBITDA, DCF).
El UUID no es enumerable, pero se filtra por links/logs/referer. **Fix:** exigir sesión+propiedad
en la ruta del PDF; el render interno de Chromium usa un token efímero firmado.

### A2 · Sin rate limiting (login, registro, contacto, endpoints Chromium)
`web/auth.ts` · `web/app/registro/actions.ts` · `web/app/empresa/[codigo]/actions.ts` · rutas `/api/*`
Habilita fuerza bruta de login (contraseñas de 6), spam de cuentas/leads y agotamiento de recursos
(cada PDF/flyer lanza un Chromium). **Fix:** rate limit por IP+cuenta, lockout progresivo, captcha
en registro/contacto.

### A3 · Tipo de cambio sin timeout y con fallback desactualizado
`web/lib/tc.ts`
`fetch` sin `AbortController`; si dolarapi cuelga, `calcular()` se bloquea. Ante fallo devuelve
`1200` en silencio → valuaciones con conversión ARS groseramente errada, persistidas y entregadas.
**Fix:** `AbortSignal.timeout(3000)`, loguear el fallback, y ante fallo usar el último TC bueno o
bloquear el cálculo con mensaje claro (no valuar con un número inventado).

### A4 · `migrate deploy` corre en el contenedor que sirve tráfico
`Dockerfile:28` · `railway.json`
Si una migración falla, nunca arranca `next start` y el servicio queda caído (no solo el deploy).
**Fix:** mover las migraciones a un release/pre-deploy step separado; migraciones siempre aditivas.

### A5 · Chromium sin límite de concurrencia → riesgo de OOM
`web/app/api/informe/[id]/pdf/route.ts` · `web/app/api/flyer/[id]/route.ts`
Cada request lanza un navegador completo; N concurrentes pueden tumbar el contenedor por memoria.
Además el PDF se regenera siempre (nunca se persiste). **Fix:** semáforo de concurrencia (1–2),
`--disable-dev-shm-usage`, y cachear el PDF/flyer en R2 la primera vez.

### A6 · El cron de vencimientos no está cableado
`web/app/api/cron/vencimientos/route.ts` · `railway.json`
Railway no define cron; si nadie lo dispara, las publicaciones **nunca vencen** y no se envían los
avisos de 10/1 día. La lógica es idempotente (bien). **Fix:** Railway Cron o GitHub Actions al
endpoint con `x-cron-secret`; monitor si no corre en 24–48 h.

### A7 · Sin manejo de errores ni estados de carga (impacto directo en conversión)
No existen `error.tsx`, `global-error.tsx`, `not-found.tsx` ni `loading.tsx`. El caso peor: en el
wizard, `calcular()` se llama sin try/catch (`web/components/wizard/Wizard.tsx:55`) — si falla tras
~15 min de carga, el usuario ve la pantalla de error cruda de Next en inglés, sin salida. **Fix:**
boundaries de error con copy amable + reintentar; `loading.tsx` en `/valuar/[id]/*`; try/catch en
`calcular` con error inline.

### A8 · Cero observabilidad y cero analítica
Sin Sentry (ni logging estructurado) → los fallos de clientes reales no se detectan. Sin analítica
→ el embudo (visita → inicia → paga) no se puede medir. **Fix:** Sentry (`@sentry/nextjs`) +
GA4/Plausible con eventos clave (`inicia_valuacion`, `wizard_paso`, `inicia_pago`, `pago_exitoso`
server-side, `contacto_enviado`).

### A9 · Faltan recaudos de defensa del consumidor
Sin **derecho de arrepentimiento** (10 días, art. 34 LDC / art. 1110-1111 CCyC), sin **identidad
del proveedor** (razón social, CUIT, domicilio) y sin **política de reembolso** visible antes de
pagar. **Fix:** informarlos en el checkout y en los T&C.

### A10 · Estado de pago no valida monto/moneda y puede revertir estados
`web/lib/valuaciones.ts:25` · `web/lib/mercadopago.ts`
No se compara el monto/moneda cobrado con lo esperado; `marcarPagada` fuerza `PAGA` sin mirar el
estado actual, así que un reenvío tardío del webhook puede revertir `RECHAZADA`/`PUBLICADA` →
`PAGA` (deshace reembolsos). **Fix:** validar `amount ≥ MONTO_TOTAL` y `currency = ARS`; transición
condicional (solo `CALCULADA/BORRADOR → PAGA`), no tocar pagos ya `REEMBOLSADO`.

---

## 🟡 Medios

- **M1 · Webhook MP sin validación de firma** (`api/mp/webhook`). Mitigado porque re-consulta a MP, pero conviene validar `x-signature` (HMAC).
- **M2 · Upload valida solo el MIME del cliente** (`api/upload`, `storage.ts`): sin magic bytes; `/api/media` sin `X-Content-Type-Options: nosniff`. (Path traversal sí está bien mitigado.)
- **M3 · `CRON_SECRET` aceptado por query string** (`api/cron/vencimientos:14`): se filtra en logs. Solo por header.
- **M4 · `/api/valuar` público** sin auth: abuso de CPU y filtra `err.message`.
- **M5 · Informe HTML rompe en mobile** (`informe/page.tsx`): `px-10` fijo, `grid-cols-2` sin breakpoint, tabla de 5 columnas sin `overflow-x-auto`.
- **M6 · Tarjeta-ejemplo del hero oculta en mobile** (`page.tsx:71`): se pierde el gancho visual en el dispositivo principal. Mostrar versión compacta.
- **M7 · Retorno de pago sin auto-refresh** (`pago/retorno`): si queda "en confirmación", el usuario debe refrescar a mano. Agregar polling + aviso de que llega por email/panel.
- **M8 · Inputs sin `<label>` asociado**; formularios de contacto con solo placeholder (`ContactForm`, `PublicarForm`). Accesibilidad + conversión.
- **M9 · Filtro de provincia es texto libre** en el marketplace (`marketplace/page.tsx:54`) vs `select` en el resto → "Cordoba" ≠ "Córdoba", 0 resultados. Usar el mismo select.
- **M10 · Sin header/logout durante el embudo** de valuación. Agregar header liviano (logo → panel).
- **M11 · Sin structured data (JSON-LD)** en fichas/marketplace: se pierden rich results (Product/Offer/LocalBusiness, cuidando privacidad en anónimas).
- **M12 · OG image de la ficha se genera con Chromium** en cada request y cuelga de `/api` (bloqueado en robots): pesado y no indexable. Migrar a `next/og` o pre-generar a R2.
- **M13 · Falta OG image default + favicon/icons** (`layout.tsx` sin `images`, sin `app/icon`/`favicon`). Preview pelado en redes.
- **M14 · Páginas públicas `force-dynamic` + `vistas++` en el render**: cada crawl pega a DB e infla la métrica con bots. Considerar ISR y mover el contador a un beacon del cliente.
- **M15 · seed-admin sobrescribe la contraseña del admin en cada arranque** (`seed-admin.mjs`). Usar create-only.
- **M16 · Sin GC de datos**: borradores abandonados, imágenes R2 huérfanas, leads sin retención → costo creciente y privacidad.
- **M17 · S3/R2 sin reintento ni timeout** cuando está configurado pero intermitente (`storage.ts`).
- **M18 · Sin checkbox de consentimiento** en registro/publicar; sin registro auditable (fecha + versión aceptada).
- **M19 · IVA no discriminado ni mención de factura** al consumidor (`valuaciones.ts` lo calcula solo internamente). Definir circuito de facturación.
- **M20 · Responsabilidad por contenido de terceros**: falta ToU del marketplace + botón de reporte/takedown (doctrina CSJN de intermediarios).
- **M21 · Redundancia de datos en el embudo**: antigüedad (elegibilidad) vs año de inicio (W1); facturación rango vs ventas exactas. Fricción.

---

## ⚪ Bajos

- **X1 · Política de contraseñas débil** (mín. 6): subir a 8–10 + chequeo de comunes.
- **X2 · Fuga de `err.message` interno al cliente** (`api/upload`, `api/valuar`, `api/flyer`).
- **X3 · Sin prueba social ni garantía** en landing/checkout (para pedir $150.000).
- **X4 · Confusión de moneda**: "$150.000" (ARS) junto a "USD …"; aclarar ARS en el precio del servicio.
- **X5 · Imágenes con `<img>` crudo** en marketplace/ficha en vez de `next/image` (CWV/mobile).
- **X6 · `tcFecha` es un campo muerto** (`calcular` nunca lo escribe): sin auditoría del TC usado.
- **X7 · Emails sin cola ni reintento** (`.catch(()=>{})`): un lead perdido tiene valor comercial.
- **X8 · Constantes de precio duplicadas** (`MONTO_TOTAL` vs `PRECIO_ARS`): riesgo de drift.
- **X9 · Botones de acción sin `flex-wrap`** en `completo` / `DriversChart` con ancho fijo (mobile 320px).
- **X10 · "Guardar y seguir después" sin confirmación visible** en el wizard.
- **X11 · Inscripción de la base de datos ante la AAIP** (trámite administrativo, Ley 25.326 art. 21).

---

## Lo que ya está BIEN (no tocar)

- Control de propiedad (`assertOwner`) consistente en todo el wizard y páginas de resultado; usa `notFound()` (no revela existencia).
- `requireAdmin` en las dos acciones de moderación (no solo en la página).
- El retorno de pago **re-consulta a MP** y no confía en la query manipulable; `marcarPagada` es idempotente para no duplicar el registro `Pago`.
- Contraseñas con bcrypt; `.env` no commiteado; `AUTH_SECRET` configurado; seed-admin falla cerrado (sin clave por defecto).
- Path traversal en `/api/media` bien mitigado; cron falla cerrado sin secreto.
- Cron idempotente; `browser.close()` en `finally` (sin Chromium zombie); migraciones aditivas.
- TC congelado por valuación (sin inconsistencia calcular→publicar); metadata/robots/sitemap dinámico presentes; `baseUrl()` centralizado (migración de dominio casi trivial).
- Estados vacíos claros, estados `pending` en acciones de cliente, validaciones soft del wizard, ficha pública responsive.

---

## Plan de remediación sugerido

**Lote A — Bloqueantes de seguridad y pago (código):** B1, B2, B3, B4, A1, A10.
**Lote B — Robustez y errores (código):** A3, A5, A7, A8 (código), M1, M2, M3, M4.
**Lote C — UX/mobile (código):** M5, M6, M7, M8, M9, M10, X3, X4, X9.
**Lote D — Legal (borradores + checkboxes; requiere abogado):** B5, B6, A9, M18, M19, M20.
**Lote E — Infra/config (con tu intervención):** B7 (backups), A4 (release step), A6 (cron), A8 (cuentas Sentry/GA), healthcheck.

Prioridad: **A → luego B y D en paralelo → C → E**. Los lotes A/B/C son código que se puede
ejecutar y desplegar; el D combina páginas nuevas con revisión legal; el E requiere config en
Railway y cuentas de terceros.
