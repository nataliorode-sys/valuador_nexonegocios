# Etapa 5 — Informe de Valuación (PDF) — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
Es el **entregable principal pago**. Debe verse **premium**, ser **comprensible** para un no financiero, y a la vez **profesional y prudente** (protege la marca). Generación **automática y determinística** desde el motor (Etapa 4).

## 5.0 Principios del informe
1. **Premium pero claro.** Diseño limpio, marca NexoNegocios, lenguaje llano con la data técnica en anexo.
2. **Siempre rango, nunca cifra única** (D4). El número grande es un rango.
3. **Prudente y transparente.** Deja constancia de que es orientativo, autodeclarado y no verificado; muestra cómo se llegó al número.
4. **Accionable.** No sólo dice "cuánto vale", sino "**qué mueve tu valor y cómo mejorarlo**" (diferenciador + gancho de venta).
5. **Bilingüe de moneda:** USD (ancla) y ARS, con `tc_ref` y fecha.

## 5.1 Especificaciones de formato (para Claude Code)
- **Tamaño:** A4 vertical. **Extensión:** 8–12 páginas.
- **Encabezado:** logo NexoNegocios + "NexoDirecto". **Pie:** código de informe, fecha, paginación, mini-disclaimer ("Orientación no vinculante").
- **Marca de agua sutil** "Orientativo" opcional en páginas de valor.
- **Tipografía:** una sans legible (títulos/《cuerpo》). **Paleta:** colores de marca NexoNegocios (definir en Etapa 7/guía visual).
- **Código de informe:** `ND-{año}-{secuencial}` (ej. ND-2026-000481). Sella: `tc_ref`, fecha, versión de parámetros del motor.
- **Generación:** server-side, determinística; mismos datos → mismo PDF (salvo fecha/tc).

## 5.2 Estructura del informe (secciones)

### Portada
Nombre del negocio · rubro · ubicación · "Informe de Orientación de Valuación" · fecha · código · logo. Recuadro inferior: *"Documento orientativo basado en información provista por el propietario."*

### 1. Aviso importante (media página, arriba)
Naturaleza del informe en 4–5 líneas: orientativo, autodeclarado, no verificado, no vinculante, no es tasación pericial ni recomendación de inversión. Remite al disclaimer completo (§ final).

### 2. Resumen ejecutivo ⭐ (la página que todos leen)
- **Recuadro destacado con el RANGO de valuación** en USD y ARS:
  `USD 120.000 – USD 180.000` · `≈ ARS 150M – 225M` · **Valor orientativo: USD 150.000**.
- Método predominante (múltiplos / DCF / activos) en una línea.
- 3–4 bullets de contexto: qué tipo de negocio, qué lo hace valer más/menos, nivel de confianza (precisión %).
- **Gráfico de rango** (barra horizontal Conservador — Base — Optimista).

### 3. Perfil del negocio
Ficha: rubro, ubicación, antigüedad, empleados, dueños que trabajan, local (propio/alquilado), qué incluye la venta (tangibles + intangibles). Descripción del negocio (de `w1_actividad_desc`).

### 4. Situación económica (los números normalizados)
- **Tabla P&L simplificado (anual, USD):** Ventas → − Costo de mercadería → − Gastos fijos → = Resultado → + ajustes de normalización → **SDE** → − sueldo de mercado del dueño → **EBITDA normalizado**.
- **Gráfico waterfall** de Ventas → SDE → EBITDA.
- **Explicación de la normalización** en criollo: por qué sumamos tus gastos personales y ajustamos tu sueldo ("para reflejar lo que gana el negocio en manos de otro dueño").

### 5. Metodología (cómo lo calculamos, en simple)
Explicación de los 3 métodos y **cuál pesó más en tu caso** y por qué. Media página, tono didáctico. Tabla comparativa de los 3 valores obtenidos.

### 6. Valuación por múltiplos
- Múltiplo base del rubro y **cómo se ajustó** por los factores de tu negocio (tabla de ajustes: +crecimiento, −dependencia del dueño, etc.).
- Múltiplo final aplicado y **valor resultante**.

### 7. Flujo de fondos proyectado (DCF)
- **Tabla de 5 años**: flujo proyectado, supuestos (crecimiento real, tasa de descuento, valor terminal).
- **Gráfico de barras** del flujo por año.
- Valor presente resultante. Nota didáctica de qué significa "traer a valor de hoy".

### 8. Valor por activos ("qué se lleva el comprador")
- **Tabla de activos netos**: equipamiento, inventario, cuentas, inmueble (si aplica) − deudas.
- **Lista de intangibles** (marca, web, redes + seguidores, cartera, licencias) como valor cualitativo.
- Sirve de **piso** del rango.

### 9. Escenarios y rango
- **Gráfico del rango** con los 3 escenarios y la tabla (palancas: múltiplo, crecimiento, tasa).
- **Explicación de la incertidumbre**: por qué el rango es más ancho o angosto (completitud de datos, atipicidad, riesgo).

### 10. Factores que influyen en tu valor (drivers) ⭐ diferenciador
- Qué **sube** y qué **baja** el valor de *este* negocio (dependencia del dueño, concentración de clientes, crecimiento, recurrencia, formalidad de la info).
- **"Cómo aumentar el valor antes de vender"**: 3–5 recomendaciones accionables. (Alto valor percibido + gancho natural al Servicio Full.)

### 11. Conclusiones y recomendación de precio
- Síntesis del valor orientativo y rango.
- **Sugerencia de precio de publicación** (rango orientativo), aclarando que **la decisión final es del dueño** (D4/A2-E).
- Consideraciones para negociar.

### 12. Próximos pasos
- Publicar en el Marketplace de NexoNegocios (incluido en el plan).
- **CTA a Servicio Full** para quien quiera acompañamiento profesional (upsell — D1).

### 13. Disclaimer legal completo (página final)
Texto legal extenso (ver §5.4). Aceptación registrada con fecha/hora/usuario.

### Anexo A — Datos utilizados
Todos los inputs cargados por el usuario (constancia de sobre qué se calculó) + `tc_ref`, fecha, versión de parámetros, código de informe.

## 5.3 Gráficos y tablas (inventario)
| Elemento | Tipo | Sección |
|----------|------|---------|
| Rango de valuación | Barra horizontal (conserv.—base—optim.) | 2, 9 |
| P&L a EBITDA | Waterfall | 4 |
| Flujo de fondos 5 años | Barras | 7 |
| Comparación de métodos | Barras/dumbbell | 5 |
| Composición de activos | Barra apilada | 8 |
| Drivers de valor | Barras +/− (tornado) | 10 |

Todos con paleta de marca, accesibles, y **rótulos de valor en USD**. (Cuando se diseñe la guía visual en Etapa 7 se fija la paleta exacta.)

## 5.4 Disclaimer (contenido obligatorio)
Debe cubrir, como mínimo:
- Informe **orientativo y no vinculante**; **no** es tasación, pericia, ni auditoría.
- Basado **exclusivamente en información provista por el propietario, no verificada** por NexoNegocios.
- **No** constituye recomendación de compra/venta ni asesoramiento financiero/legal/impositivo.
- El **valor real** de una transacción depende de la negociación, due diligence y condiciones de mercado.
- NexoNegocios **no garantiza** la venta ni el precio, y **no interviene** en la negociación (producto NexoDirecto).
- Validez temporal limitada (contexto macro/tc variable).
- Limitación de responsabilidad y aceptación de términos por el usuario (con registro).

## 5.5 Reglas de contenido dinámico
- Si `SDE ≤ 0`: el informe **cambia de tono** — foco en valor por activos, sin proyección de rentabilidad, mensaje claro.
- Si datos incompletos: se muestran secciones con lo disponible + banda ancha + nota de precisión.
- Si empresa "Grande": banner interno sugiriendo Servicio Full.
- Idempotencia: el informe se puede regenerar; si el usuario editó datos, se **re-versiona** ("v2 — actualizado el …").

## 5.6 Decisiones abiertas de la Etapa 5
| ID | Decisión | Recomendación |
|----|----------|---------------|
| **R5-A** | Marca del informe | **Co-branded** NexoNegocios + NexoDirecto. |
| **R5-B** | ¿Incluir sección "cómo aumentar el valor"? | **Sí.** Diferenciador y gancho de upsell. |
| **R5-C** | ¿Sugerir precio de publicación en el informe? | **Sí, como rango**, aclarando que decide el dueño. |
| **R5-D** | Nivel técnico | Explicaciones simples en el cuerpo + **detalle técnico en anexo**. |
| **R5-E** | Extensión objetivo | **8–12 páginas** (premium sin ser abrumador). |
| **R5-F** | Motor de render PDF | Definir en Etapa 8 (spec técnica); prioridad: fidelidad visual + gráficos. |
