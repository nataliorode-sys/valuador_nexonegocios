# Etapa 8 — Especificación Funcional Maestra (para Claude Code) — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
Documento **autocontenido** para desarrollar la aplicación. Consolida las Etapas 1–7 y agrega **modelo de datos, reglas, requisitos no funcionales, stack técnico recomendado y roadmap**. Ante cualquier duda de detalle, remite al doc de la etapa correspondiente (`01`–`07`).

---

## 8.1 Resumen del producto
Web app de autogestión para que el dueño de una empresa argentina obtenga una **orientación de valuación** (informe PDF), la **publique 100 días** en el Marketplace de NexoNegocios y genere un **flyer** de difusión, con **contacto directo** vendedor↔comprador y **sin intermediación**. Precio: **$180.000 + IVA**. Producto: **NexoDirecto**. Decisiones rectoras: `00-decisiones-clave.md` (D1–D8, A2-*, F3-*, M4-*, R5-*, M6-*, FL7-*).

## 8.2 Glosario
- **SDE**: ganancia disponible para el dueño-operador. **EBITDA normalizado**: SDE menos sueldo de mercado del dueño.
- **tc_ref**: tipo de cambio de referencia (dólar MEP, admin).
- **Valuación**: proceso completo de una empresa (datos → cálculo → informe → publicación).
- **Ficha**: publicación en el Marketplace. **Lead**: consulta de un comprador.

## 8.3 Roles y autenticación
| Rol | Accede a |
|-----|----------|
| **Visitante** | Landing, Marketplace, Fichas, formulario de contacto (sin cuenta) |
| **Vendedor** (usuario registrado) | Wizard, pago, resultado, publicación, panel, leads |
| **Admin** (NexoNegocios) | Moderación, parámetros del motor, gestión, métricas |

Auth: email + contraseña y/o **magic link**. Verificación de email. Recuperación de contraseña. Sesión persistente. Cuenta se crea tras la elegibilidad (A2-A). **Autoguardado** del wizard para retomar (email con deep-link al paso).

## 8.4 Mapa de rutas (pantallas → ver `02-arquitectura.md`)
```
Público:   /                         Landing (S1)
           /marketplace              Listado (S2)
           /empresa/{codigo}         Ficha (S3) + contacto (S3b)
           /ingresar /registro       Auth (S4)
Vendedor:  /valuar                   Elegibilidad (S5)
           /valuar/paso/{1..7}       Wizard (W1–W7)
           /valuar/calculo           Cálculo (S6)
           /valuar/resultado         Teaser (S7) [paywall]
           /valuar/pago              Checkout (S8)
           /valuar/informe           Resultado completo (S9)
           /valuar/publicar          Armado (S10) + preview (S11) + envío (S12)
           /panel                    Dashboard (S13)
           /panel/{id}               Detalle (S13a) + leads (S14)
           /panel/{id}/renovar       (S15)   /full  Upsell (S16)   /cuenta (S17)
Admin:     /admin/moderacion (A1)  /admin/parametros (A2)  /admin/gestion (A3)  /admin/metricas (A4)
```

## 8.5 Modelo de datos (entidades principales)
> PostgreSQL. IDs UUID. Timestamps `created_at`/`updated_at`. Montos en centavos o `numeric`. Todo monto normalizado también en USD.

**User**: id, email (único), password_hash / magic, nombre, teléfono, email_verificado, rol, created_at.

**Valuacion**: id, user_id, estado (enum §8.6), codigo (`ND-2026-000481`), moneda_carga, tc_ref, tc_fecha, engine_version, precision_pct, created_at, updated_at.

**PerfilNegocio** (1:1 con Valuacion — datos del formulario): todos los campos `elg_*`, `w1_*`…`w7_*` de `03-formulario.md` (tipados). Guarda inputs crudos + versión anualizada/USD.

**ResultadoCalculo** (1:1): sde, ebitda_norm (USD), clase_tamaño, familia_multiplo, multiplo_final, valor_multiplos, valor_dcf, valor_activos, valor_central, rango_min, rango_max (USD y ARS), escenarios (JSON conserv/base/optim), tabla_dcf (JSON 5 años), drivers (JSON), metodo_predominante, flags (JSON).

**Pago**: id, valuacion_id, proveedor (mercadopago), estado (pendiente/aprobado/rechazado/reembolsado), monto, iva, external_id, datos_factura (JSON), created_at.

**Informe**: id, valuacion_id, version, url_pdf, hash, generado_at.

**Publicacion** (Ficha): id, valuacion_id, titulo, descripcion, precio_publicacion, moneda, nivel_privacidad (anonima/identificada), config_financieros (JSON: mostrar rango sí/no), fotos (array URLs), highlights (JSON), sello_existencia (bool + fuente), estado_pub, fecha_publicacion, fecha_vencimiento, vistas.

**Flyer**: id, valuacion_id, plantilla, formatos (JSON urls por formato), generado_at.

**Lead**: id, publicacion_id, nombre, email, telefono, mensaje, created_at. (Se envía al vendedor + se revela contacto al comprador.)

**Moderacion**: id, publicacion_id, admin_id, resultado (aprobada/rechazada), motivo, checklist_existencia (JSON), created_at.

**ParametrosMotor** (versionado): version, tc_ref, tasas (JSON), multiplos_por_familia (JSON), primas (JSON), t_efectiva, capex_mant, ct_por_familia, g_defaults, umbrales_tamaño, anchos_banda, vigente (bool). El informe **sella** la `version` usada.

**Rubro**: id, nombre_visible, familia_multiplo, tiene_stock (bool). (Del anexo.)

## 8.6 Máquina de estados (ver `02-arquitectura.md §2.3`)
`Valuacion.estado`: BORRADOR → CALCULADA → PAGA → PUBLICACION_EN_ARMADO → EN_REVISION → (PUBLICADA | RECHAZADA). `Publicacion.estado_pub`: PUBLICADA → (VENCIDA | VENDIDA | PAUSADA) → (renovar) → PUBLICADA. Transiciones válidas se validan en backend; toda transición registra auditoría.

## 8.7 Motor de valuación (contrato computacional — ver `04-motor-valuacion.md`)
- **Input:** `PerfilNegocio` normalizado a USD con `tc_ref`. **Parámetros:** `ParametrosMotor` vigente.
- **Output:** `ResultadoCalculo` completo (central, rango, escenarios, tabla DCF, drivers, método).
- **Requisitos:** **determinístico** (sin aleatoriedad); todas las guardas anti-error de §4.17; clamps de múltiplo/tasa; piso por activos; nunca valor negativo al usuario; sella `engine_version`, `tc_ref`, fecha.
- **Ubicación:** módulo puro y testeable (funciones sin efectos), con **suite de tests** de casos (rentable, no rentable, asset-heavy, datos incompletos, extremos). Ver criterios en §8.13.

## 8.8 Generación de informe PDF (ver `05-informe-pdf.md`)
Server-side, determinística, A4 8–12 pág., co-branded, con los 6 gráficos y tablas. Contenido dinámico según flags (SDE≤0, incompleto, grande). Versionable. Almacena URL + hash. Disclaimer completo (§5.4) + registro de aceptación.

## 8.9 Marketplace (ver `06-marketplace.md`)
Auto-armado de ficha; público/privado por campo; anonimato a elección; financieros en rango; precio del dueño; sello "Negocio real · Existencia verificada" (chequeo en moderación); contacto relay+reveal; vigencia 100 días con avisos día 90/99; SEO (URLs amigables, meta, datos estructurados); filtros y búsqueda; diferenciación NexoDirecto vs Intermediada.

## 8.10 Flyer (ver `07-flyer.md`)
Auto-generado (story + post), 2–3 plantillas con auto-selección por rubro, respeta privacidad, link corto + QR, botón compartir WhatsApp. Regenerable.

## 8.11 Reglas de negocio transversales
- **Paywall en el medio** (D3): el motor corre para el teaser; el pago **desbloquea**; no recalcula salvo edición.
- **Teaser** (A2-B): resumen de lo cargado + imágenes borrosas sin valores; sin semáforo; sin valor/rango.
- **Reembolso** si moderación rechaza publicación (A2-D).
- **Precio** lo fija el dueño con advertencia si se aparta del rango (A2-E).
- **Moderación 100% manual** al inicio (A2-C) con checklist de existencia (§6.3.1) y de contenido (rechazar ilegal/sexual/etc.).
- **Validaciones** hard/soft y cruzadas (§3.11); datos atípicos ensanchan el rango, no bloquean.
- **Autoguardado + retoma** por email.

## 8.12 Requisitos no funcionales
- **Seguridad:** hashing de contraseñas, protección de datos financieros (cifrado en reposo de campos sensibles), control de acceso por rol, rate-limiting en contacto/login, OWASP básico, backups.
- **Privacidad:** minimizar exposición pública (M6), consentimientos y disclaimers registrados, cumplimiento Ley 25.326 (datos personales AR).
- **Determinismo y auditoría:** cálculo reproducible; sellado de versión/tc; log de transiciones de estado y de moderación.
- **Performance:** cálculo < 3 s; generación PDF/flyer < 10 s (async con indicador si hace falta); Marketplace con paginación.
- **Responsive & accesibilidad:** mobile-first (muchos usan celular), contraste, labels, teclado.
- **i18n de moneda/número:** formato es-AR ($ y separadores), USD/ARS.
- **Observabilidad:** logs, métricas de conversión (funnel), errores.

## 8.13 Criterios de aceptación (muestras)
- Un usuario completa el wizard mínimo → obtiene teaser sin ver el valor.
- Paga → se desbloquean valor, rango (USD/ARS), informe PDF descargable, y puede armar la publicación.
- Empresa no rentable (SDE≤0) → informe en modo activos, sin valores negativos.
- Publicación no sale al Marketplace hasta aprobación de moderación.
- Ficha anónima no expone nombre/dirección; contacto sólo por relay.
- Mismos inputs + misma engine_version → mismo `ResultadoCalculo` (test de determinismo).
- Rechazo de moderación → estado RECHAZADA + reembolso.
- Vencimiento a 100 días → sale de público; avisos día 90/99 enviados.

---

## 8.14 Stack técnico recomendado
> Recomendación pragmática y moderna; el cliente puede ajustar. Prioriza: SEO del Marketplace, fidelidad visual de PDF/flyer, y velocidad de desarrollo con Claude Code.

| Capa | Recomendación | Por qué |
|------|---------------|---------|
| **Frontend + Backend** | **Next.js (App Router) + TypeScript** | Full-stack, SSR/SSG para SEO del Marketplace, server actions, un solo repo |
| **UI** | **Tailwind CSS** + componentes (shadcn/ui) | Rápido, responsive, consistente |
| **Base de datos** | **PostgreSQL** + **Prisma ORM** | Relacional (datos financieros, auditoría), migraciones tipadas |
| **Auth** | **Auth.js (NextAuth)** | Email+password / magic link, sesiones |
| **PDF** | **HTML/CSS → PDF con headless Chromium** (Playwright/Puppeteer; `@sparticuz/chromium` si serverless) | Máxima fidelidad visual + gráficos; reusa el mismo diseño web |
| **Gráficos** | Librería JS (Recharts/Chart.js) renderizada server-side para PDF | Coherencia entre web e informe |
| **Flyer (imagen)** | **Satori/@vercel/og** o Chromium→PNG (sharp) | Genera PNG de alta resolución desde plantilla |
| **Pagos** | **Mercado Pago** (Checkout Pro/API) + **webhooks** | Estándar en Argentina; factura + IVA |
| **Almacenamiento** | **S3-compatible** (fotos, PDFs, flyers) | Escalable, URLs firmadas |
| **Email transaccional** | Resend / SendGrid | Retoma, verificación, notificaciones, leads |
| **Compartir WhatsApp** | Links `wa.me` (MVP); WhatsApp Business API (futuro) | Difusión del flyer/ficha |
| **Verificación existencia** | Manual en moderación (MVP); APIs (CUIT/Google) a futuro | Sello sin bloquear |
| **Hosting** | Vercel (web) + servicio Node con Chromium para PDF/flyer, o contenedor único (Railway/Render/Fly.io) | Chromium requiere entorno adecuado |
| **Config del motor** | Tabla `ParametrosMotor` versionada + panel admin | Editable sin deploy; sellado en informes |

**Integraciones/entorno (variables):** claves Mercado Pago, SMTP/Resend, bucket S3, `tc_ref` (manual o feed), dominio, secretos de auth.

## 8.15 Roadmap de construcción (fases para Claude Code)
1. **Fase 0 — Fundaciones:** repo, Next.js+TS, Tailwind, Postgres+Prisma, Auth, layout, modelo de datos, panel admin de parámetros.
2. **Fase 1 — Motor + Wizard:** formulario 7 pasos con autoguardado y validaciones; **motor de valuación** (módulo puro + tests); pantalla de cálculo.
3. **Fase 2 — Paywall + Informe:** teaser, Mercado Pago + webhooks, resultado completo, **generación PDF**.
4. **Fase 3 — Publicación + Marketplace:** armado de ficha, moderación (admin), Marketplace público, ficha, contacto relay+reveal, leads.
5. **Fase 4 — Flyer + Panel:** generación de flyer, dashboard del vendedor, renovación, upsell, notificaciones (email/WhatsApp), avisos de vencimiento.
6. **Fase 5 — Pulido:** SEO, métricas de funnel, accesibilidad, seguridad, tests e2e, calibración de parámetros y anexo de rubros.

Cada fase entrega algo funcional y testeable. La **Fase 1 (motor)** es la crítica: se construye con tests antes de conectar UI.

## 8.16 Pendientes a calibrar antes de producción
- Múltiplos por familia (con datos reales de NexoNegocios).
- Componentes de tasa y `tc_ref` operativo.
- **Anexo de rubros** (`anexo-rubros.md`) — 40–60 rubros → familias.
- Guía visual de marca (paleta, tipografías, logos) para web/informe/flyer.
- Textos legales definitivos (disclaimer, términos, privacidad) revisados por un abogado.
- Precio final y esquema de IVA/facturación.
