# Etapa 6 — Marketplace — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
La publicación se **arma automáticamente** con datos del formulario + el paso de armado (S10), pasa por **moderación** (A1) y sale al Marketplace por **100 días**.

## 6.0 Principios
1. **Auto-armado.** La ficha se pre-completa sola desde el wizard; el dueño edita/aprueba, no carga de cero.
2. **Privacidad por defecto.** Vender un negocio es sensible (empleados, competencia, clientes). La ficha es **anónima por defecto**; el dueño puede revelar identidad si quiere.
3. **Protección de datos financieros.** Nunca se exponen los números finos. En público se muestran **rangos** y señales, no el detalle.
4. **Diferenciación clara** (D7): NexoDirecto (contacto directo, info no verificada) vs. Intermediadas (asesor, info verificada).
5. **Contacto híbrido** (A2-F): formulario relay que captura lead y revela WhatsApp/email del vendedor.

## 6.1 Qué es público, qué es privado

| Dato | Fuente | Público en la ficha | Privado |
|------|--------|:---:|:---:|
| Título del aviso (auto, editable) | derivado | ✅ | |
| Rubro / categoría | `elg_rubro` | ✅ | |
| Ubicación **aproximada** (provincia + zona/localidad) | `w1_provincia/localidad` | ✅ (sin dirección exacta) | |
| Dirección exacta | — | | 🔒 |
| Antigüedad | `w1_anio_inicio` | ✅ | |
| Empleados (rango) | `w1_empleados` | ✅ (ej. "6–10") | |
| Descripción del negocio | `w1_actividad_desc` (editable) | ✅ | |
| Facturación anual | W2 | ✅ **como rango** (ej. "USD 200k–300k") | valor exacto 🔒 |
| Rentabilidad (SDE/EBITDA) | motor | ✅ **cualitativa o rango** | valor exacto 🔒 |
| **Precio de venta** (lo fija el dueño) | S10 | ✅ | |
| Qué incluye (tangibles + intangibles) | `w5_incluye_venta`, `w5_intangibles` | ✅ | |
| Motivo de venta | `w7_motivo_venta` | ✅ (opcional) | |
| Fotos / logo | S10 | ✅ | |
| Razón social / nombre real | cuenta | 🔒 (salvo que el dueño lo revele) | 🔒 |
| Datos de contacto (WhatsApp/email) | cuenta/S10 | 🔒 hasta enviar el formulario de contacto | 🔒 |
| Números finos (COGS, gastos, retiros) | W3/W4 | | 🔒 (uso interno/motor) |
| Informe PDF completo | motor | 🔒 (del dueño; puede compartirlo si quiere) | 🔒 |
| Días restantes / métricas de la publicación | sistema | 🔒 (sólo dueño en su panel) | 🔒 |

> **Nivel de detalle financiero configurable por el dueño** en S10: "Mostrar facturación como rango / no mostrar". Recomendado: mostrar **rango** (los compradores necesitan una señal para contactar, pero protegemos el número exacto).

## 6.2 Auto-construcción de la ficha (S10 + motor)
El sistema **genera y el dueño ajusta**:
- **Título sugerido:** `"{Rubro} en {Localidad} · {antigüedad} años en marcha"` (editable).
- **Resumen auto:** 2–3 frases armadas desde los datos ("Negocio de {rubro} en {zona}, en operación desde {año}, con {empleados} empleados. Se vende incluyendo {qué incluye}.").
- **Highlights automáticos** (chips), disparados por flags del motor:
  - "En marcha hace +X años" · "Rentabilidad demostrada" · "Ingresos recurrentes" · "Baja dependencia del dueño" · "Incluye marca registrada" · "Incluye web y redes (Xk seguidores)" · "Local propio incluido" · "Stock incluido".
- **Sello de confianza:** "Valuado con NexoDirecto" (no se publica el rango del informe; es privado del dueño — ver M6-C).
- **Precio:** el que fijó el dueño en S10 (con advertencia del sistema si se aparta mucho del rango — A2-E).

## 6.3 Diferenciación NexoDirecto vs. Intermediadas (D7)
Dos tipos de publicación conviven en el Marketplace, visualmente distinguidas:

| | **NexoDirecto** (este producto) | **Intermediada por NexoNegocios** (Full) |
|---|---|---|
| Badge | "Contacto directo con el vendedor" | "Intermediada · Asesor NexoNegocios" |
| Info | Provista por el propietario (no verificada) | Verificada por NexoNegocios |
| Contacto | Directo (relay + WhatsApp/email del vendedor) | A través de un asesor |
| Color/etiqueta | Distinto (definir en guía visual) | Destacado premium |

- **Filtro** en el listado por tipo.
- Nota honesta en fichas NexoDirecto: *"La información fue provista por el propietario y no fue verificada por NexoNegocios."*

## 6.4 Pantallas del Marketplace
- **S2 Listado:** grilla de tarjetas. **Filtros:** rubro, provincia, rango de precio, rango de facturación, tipo (Directo/Intermediada), qué incluye (inmueble/stock). **Orden:** recientes, precio ↑↓. **Búsqueda** por texto.
- **Tarjeta:** foto, título, rubro, ubicación aprox., precio, 2–3 highlights, badge de tipo.
- **S3 Ficha:** galería, descripción, highlights, qué incluye, facturación (rango), precio, ubicación aprox., badge/disclaimer, **botón Contactar**. Aviso de "info no verificada".
- **S3b Contacto (relay):** el comprador deja nombre + email/teléfono + mensaje → se registra como **lead** en el panel del vendedor (S14) → se le muestra/envía el WhatsApp/email del vendedor (A2-F). Anti-spam (captcha/límite).

## 6.5 Ciclo de vida de la publicación
- Sale a público sólo tras **aprobación de moderación** (A1).
- **Vigencia 100 días** (contador interno). Avisos al vendedor día 90 y 99.
- Estados que la sacan de público: **VENCIDA** (100 días), **VENDIDA**, **PAUSADA**, **RECHAZADA**.
- **Renovación** paga (S15) reinicia el período.
- El vendedor puede **editar** (cambios sustanciales vuelven a moderación).

## 6.6 SEO y difusión
- Ficha pública con URL amigable (`/empresa/{codigo}`), meta tags y datos estructurados → indexable y compartible.
- Compatible con el **flyer** (Etapa 7) y links a WhatsApp.
- Página del Marketplace optimizada para captar compradores (canal orgánico).

## 6.7 Decisiones abiertas de la Etapa 6
| ID | Decisión | Recomendación |
|----|----------|---------------|
| **M6-A** | Anonimato de la ficha | **Anónima por defecto**, con opción de revelar identidad. Protege al vendedor. |
| **M6-B** | Financieros en público | **Rango** (facturación y rentabilidad), no valores exactos. Configurable por el dueño. |
| **M6-C** | ¿Publicar el rango de valuación del informe? | **No auto.** Se muestra precio del dueño + sello "Valuado con NexoDirecto". El rango del informe es privado (evita anclar/discutir el número). |
| **M6-D** | Contacto | **Relay + reveal** (A2-F), con registro de lead y anti-spam. |
| **M6-E** | ¿Cuenta para contactar? | Comprador contacta **sin cuenta** (mínima fricción); se piden datos básicos en el form. |
