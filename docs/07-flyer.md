# Etapa 7 — Flyer de Difusión — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
Pieza gráfica **auto-generada** para que el dueño difunda su empresa en venta por **WhatsApp y redes**. Debe verse profesional, respetar la privacidad elegida (M6-A) y **llevar tráfico a la ficha del Marketplace**.

## 7.0 Objetivo y principios
1. **Difusión, no informe.** El flyer **despierta interés** y manda a la ficha; no cuenta todo.
2. **Auto-generado**, coherente con la ficha (mismos datos, mismas fotos).
3. **Respeta la privacidad** (M6-A): si la ficha es anónima, el flyer también.
4. **Optimizado para WhatsApp/redes**: legible en el celular, con CTA y link/QR.
5. **Sin números sensibles**: rangos y señales, nunca el detalle financiero.

## 7.1 Formatos a generar
| Formato | Medida | Uso |
|---------|--------|-----|
| **Vertical (Story)** | 1080×1920 | WhatsApp estados, Instagram/Facebook stories |
| **Cuadrado (Post)** | 1080×1080 | Feed de Instagram/Facebook, grupos de WhatsApp |
| **(Opcional) Horizontal** | 1200×630 | Link preview / compartir en web |

Salida en **PNG/JPG** (imagen lista para compartir) y, si suma, **PDF**. Descargable y con botón "Compartir por WhatsApp".

## 7.2 Estructura del flyer (jerarquía visual)
De arriba hacia abajo:
1. **Marca:** logo NexoNegocios / NexoDirecto (discreto arriba).
2. **Encabezado gancho:** "EMPRESA EN VENTA" / "OPORTUNIDAD" / "FONDO DE COMERCIO EN VENTA" (según rubro).
3. **Título:** `{Rubro} en {Localidad}` (ej. "Restaurante en Villa Carlos Paz").
4. **Foto principal** (la mejor del dueño; si es anónima, foto genérica del rubro o del producto sin identificar).
5. **3–4 highlights** (chips/íconos) desde los datos: antigüedad, "rentabilidad demostrada", empleados, qué incluye, "incluye local propio", "marca + redes".
6. **Facturación (rango)** — opcional según config de privacidad. Ej. "Factura USD 200k–300k/año".
7. **Precio** (el del dueño) — opcional (algunos prefieren "Consultar precio").
8. **Sello:** "Negocio real · Existencia verificada por NexoNegocios".
9. **CTA + acceso:** "Más info y contacto" + **link corto** a la ficha + **QR**.
10. **Pie:** disclaimer mínimo ("Información provista por el propietario").

## 7.3 Datos que usa (mapeo) y reglas de privacidad
| Elemento | Fuente | Si ficha ANÓNIMA |
|----------|--------|------------------|
| Título (rubro + localidad) | `elg_rubro`, `w1_localidad` | Localidad puede reducirse a zona/provincia |
| Foto | fotos S10 | Usar foto no identificable / genérica del rubro |
| Highlights | motor/flags (§6.2) | Igual (no identifican) |
| Facturación (rango) | W2 | Según config del dueño (puede ocultarse) |
| Precio | S10 | Igual o "Consultar" |
| Nombre/logo del negocio | cuenta/S10 | **Oculto** |
| Link + QR | ficha Marketplace | Igual |

**Nunca en el flyer:** números finos, dirección exacta, datos de contacto directo (el contacto pasa por la ficha → relay).

## 7.4 Plantillas y personalización
- **2–3 plantillas** visuales prediseñadas (paletas/estilos), seleccionables por el dueño.
- **Auto-selección de plantilla por rubro** (ej. gastronomía cálida, industria sobria, tech moderna) como default, editable.
- Se genera server-side con los datos + fotos; el dueño **previsualiza** (S11) y puede **regenerar/elegir** antes de descargar.
- Consistencia con la guía visual de marca (Etapa 7-bis / definición de UI).

## 7.5 Generación técnica (nota para Etapa 8)
- Render a imagen desde una plantilla parametrizable (HTML/CSS→imagen o motor de composición).
- Fuentes embebidas, alta resolución (para no verse pixelado en el celular).
- Determinístico y rápido; se puede regenerar si el dueño cambia foto/precio.

## 7.6 Decisiones abiertas de la Etapa 7
| ID | Decisión | Recomendación |
|----|----------|---------------|
| **FL7-A** | Formatos | **Vertical (story) + Cuadrado (post)** como base; horizontal opcional. |
| **FL7-B** | ¿Mostrar precio en el flyer? | **A elección del dueño** (precio o "Consultar"). |
| **FL7-C** | ¿Mostrar facturación? | Según config de privacidad (M6-B); default **rango**, ocultable. |
| **FL7-D** | Cantidad de plantillas | **2–3** con auto-selección por rubro. |
| **FL7-E** | Acceso a la ficha | **Link corto + QR** (el QR sirve para imprimir en el local si el dueño quiere). |
