# Registro de Decisiones Clave — NexoDirecto

> Documento vivo. Toda decisión estratégica que condiciona el diseño se registra acá.
> Producto: **NexoDirecto** (nombre preliminar) — antes "Plan Básico".
> Empresa: NexoNegocios. Mercado: Argentina.

## Decisiones cerradas (Etapa 1)

| ID | Decisión | Resolución |
|----|----------|-----------|
| **D1** | Rol del producto: ¿reemplaza al servicio Full? | **No.** Producto independiente para negocios más chicos que no necesitan la complejidad del servicio de intermediación completo. Puede además funcionar como **funnel** hacia el Full, pero se vende **por separado**. Mensaje macro: *"Ayudamos a dueños a valuar y vender su empresa sin importar el tamaño ni el rubro; tenemos un servicio pensado para cada tipo."* |
| **D2** | Segmento / elegibilidad | Empresas **reales, en marcha, de cualquier rubro y tamaño**, salvo contenido ilegal o inapropiado. Se acota funcionalmente por la capacidad del motor (ver Etapa 3/4), no por rubro. Hay una **etapa final de moderación/aprobación** de NexoNegocios que bloquea publicaciones ilegales, contenido sexual, etc. Las empresas reales avanzan. |
| **D3** | Paywall | **En el medio.** El usuario carga sus datos y llega hasta el borde del resultado, pero **NO ve el valor gratis** (mucha gente quiere sólo saber el número). Se muestra un **avance/teaser gratuito** (que el informe está listo, metodología, un adelanto parcial) con un fuerte llamado a pagar. Al pagar $180.000 + IVA se desbloquea: valor + informe completo + publicación + flyer. |
| **D4** | Posicionamiento legal del resultado | El resultado es una **orientación / recomendación** de NexoNegocios basada **exclusivamente en información ingresada por el usuario, sin verificación**. Siempre **rango**, nunca cifra única. La decisión del valor a publicar y el éxito de la venta **dependen del dueño**. Disclaimer aceptado con checkbox y registrado. |

## Definiciones de producto derivadas

- **D5 — Nombre:** "Valuación Express" se descarta. Nombre preliminar del producto: **NexoDirecto** (transmite: contacto directo vendedor↔comprador, autogestión, sin intermediación). A validar branding.
- **D6 — Nivel de sofisticación:** El motor debe ser **robusto y sin errores**, suficientemente bueno para dar una orientación creíble, pero **no tan complejo** que el usuario no pueda completarlo. Balance simplicidad-de-carga ↔ solidez-de-cálculo.
- **D7 — Diferenciación en el Marketplace:** La web distingue visualmente dos tipos de publicación:
  1. **Intermediadas por NexoNegocios** (servicio Full): información verificada, contacto a través de un asesor.
  2. **NexoDirecto**: contacto directo con el vendedor, información autodeclarada no verificada.
- **D8 — Datos a relevar:** El formulario debe capturar todo lo necesario para una estimación seria: rubro, ventas, costos, tendencias, estacionalidad, gastos, sueldo de dueños, inventario, capital de trabajo, activos, deudas, etc. (detalle en Etapa 3).

## Decisiones cerradas (Etapa 2)

| ID | Decisión | Resolución |
|----|----------|-----------|
| **A2-A** | Momento de creación de cuenta | Después de la **elegibilidad**, antes del wizard. **Autoguardado obligatorio**: el dueño puede cargar de a poco, cerrar y retomar otro día sin perder avance (email de retoma con deep-link al paso). |
| **A2-B** | Contenido del teaser gratuito | Mostrar: (1) **resumen de lo que cargó el usuario** (para validar "entendimos bien tu negocio"); (2) **imágenes borrosas** del flujo de fondos y del EBITDA **sin valores**. **NO** mostrar semáforo de salud (se reserva para el informe pagado; un "rojo" sin explicación da mensaje equivocado). **NO** mostrar el valor ni el rango. |
| **A2-C** | Moderación | **100% manual** al inicio (una persona de NexoNegocios aprueba/rechaza cada ficha). Migrar a semi-automática con volumen y aprendizaje. |
| **A2-D** | Reembolso si se rechaza la publicación | **Sí, se reembolsa.** Prioridad: evitar conflicto y cliente insatisfecho. (Aplica a rechazos de publicación; el informe puede haberse entregado igual.) |
| **A2-E** | Precio a publicar | Lo **decide el dueño**; el sistema sugiere el rango y **advierte** si se aparta mucho. |
| **A2-F** | Contacto comprador↔vendedor | **Híbrido recomendado:** formulario *relay* que captura el lead (queda registrado en el panel) y, al enviarlo, **revela/envía el WhatsApp y email del vendedor** para contacto directo. El vendedor elige qué datos exponer. Combina "contacto directo" (D7) con captación de leads y protección anti-spam. |

## Decisiones cerradas (Etapas 3–6) — resumen
- **Formulario (F3):** 1 año de ventas con carga flexible; catálogo de rubros amplio (anexo); sueldo de mercado del dueño con sugerencia; costos por checklist guiado; activos tangibles + intangibles; avisos ante datos atípicos + mini-resumen por paso. Detalle en `03-formulario.md`.
- **Motor (M4):** múltiplos (primario) + DCF (secundario, 60/40) + activos (piso); ancla en **USD** (dólar MEP), sin promediar años; escenarios conservador/base/optimista; rango que se ensancha con la incertidumbre. Detalle en `04-motor-valuacion.md`.
- **Informe (R5):** co-branded, 8–12 pág., siempre rango, sección "cómo aumentar el valor", muestra razonamiento pero no parámetros internos. Detalle en `05-informe-pdf.md`.
- **Marketplace (M6):** anonimato **a elección del dueño**; financieros públicos como **rango**; se publica **el precio del dueño** (no el rango de valuación); sello **"Negocio real · Existencia verificada"** (chequeo liviano en moderación, NO "datos verificados", que es del Full); fotos 3–6; contacto relay+reveal. Detalle en `06-marketplace.md`.

## Decisiones abiertas (a resolver en su etapa)

- Momento y campos exactos del teaser del paywall (Etapa 2).
- Segmentación fina de parámetros del motor por tamaño de empresa (Etapa 4).
- Política de renovación pasados los 100 días (Etapa 2/6).
