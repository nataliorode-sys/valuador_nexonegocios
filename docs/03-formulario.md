# Etapa 3 — Diseño del Formulario (campo por campo) — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
Alimenta el motor de la Etapa 4. Filosofía: **máxima precisión con la mínima cantidad de preguntas.**

## 3.0 Principios del formulario
1. **Lenguaje llano.** Nunca se pide "EBITDA", "tasa" ni "múltiplo". Se pregunta por plata que entra y sale; el motor arma el resto.
2. **Se construye el P&L de abajo hacia arriba.** Ventas − costos − gastos → el sistema deriva la ganancia normalizada. El usuario nunca ingresa "la ganancia" (dato poco confiable).
3. **Mínimo obligatorio + opcionales que afinan.** Con el set mínimo el motor ya calcula (rango amplio). Cada dato optativo **angosta el rango**. UX: *"Completá más para afinar tu estimación"* con una barra de precisión.
4. **Montos con período flexible.** Campos como alquiler o sueldos aceptan carga **mensual o anual** con un selector; el sistema anualiza. Reduce errores.
5. **Moneda:** se carga en ARS o USD (selector); el motor ancla en USD con el tipo de cambio del panel admin.
6. **Condicionalidad por rubro:** p. ej. inventario sólo se pide a rubros con stock.
7. **Mini-resumen al cierre de cada paso.** Al terminar cada sección se muestra un recuadro *"Esto es lo que entendimos"* con los datos cargados y los derivados clave (ej. margen implícito), para chequear y **corregir antes de arrastrar un error**. (Decisión del cliente, Etapa 3.)
8. **Carga de ventas flexible.** El dueño elige cómo cargar: anual, mes a mes (12 valores) o promedio mensual ×12. La carga mensual además **detecta la estacionalidad automáticamente**.
9. **Todo en moneda dura como ancla.** Por la inflación argentina, el motor convierte a **USD** al tipo de cambio del panel admin y razona en USD; muestra ARS y USD. Detalle en Etapa 4.

## 3.1 Convenciones de la especificación
Cada campo tiene: `id` · Etiqueta · Descripción · Obligatorio · Tipo/Formato · Validaciones · Ayuda · Ejemplo.
Tipos: `select`, `multiselect`, `number$` (monto), `percent`, `int`, `text`, `textarea`, `bool`, `year`, `period` (mensual/anual).

---

## 3.2 PANTALLA S5 — Elegibilidad (screening rápido)
Objetivo: fijar expectativas, rutear a Full si corresponde, y precargar identidad. ~5 preguntas.

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `elg_rubro` | ¿A qué se dedica tu empresa? | Sí | select (catálogo de rubros) | ∈ catálogo | "Elegí el rubro que más se parece". Ej: Gastronomía |
| `elg_en_marcha` | ¿La empresa está funcionando hoy? | Sí | bool | — | Si "No" → mensaje: este servicio es para empresas en marcha |
| `elg_antiguedad` | ¿Hace cuántos años opera? | Sí | int (0–100) | ≥0 | <2 → aviso "orientación más incierta", permite seguir. Ej: 6 |
| `elg_facturacion_rango` | Facturación anual aproximada | Sí | select (rangos) | — | Rangos en ARS. Sirve para rutear tamaño. Ej: $100M–$300M |
| `elg_datos_mano` | ¿Tenés a mano ventas y costos? | Sí | select (Sí / Más o menos / No) | — | Si "No" → sugerir juntar la info; puede guardar y volver |

**Reglas de ruteo:** si `elg_facturacion_rango` = tramo alto (a definir en Etapa 4) o el rubro es de alta complejidad → banner "tu empresa podría necesitar el **Servicio Full**" + registrar lead; **no bloquea**.

---

## 3.3 PASO W1 — Identidad del negocio

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w1_actividad_desc` | Contanos qué hace tu empresa | Sí | textarea (30–500) | min 30 car. | Se reusa (editable) en la publicación. Ej: "Panadería y cafetería de barrio con venta al público y delivery" |
| `w1_subrubro` | Actividad específica | No | select dependiente de rubro | — | Ej: Panadería |
| `w1_provincia` | Provincia | Sí | select (24 juris.) | — | Ej: Córdoba |
| `w1_localidad` | Localidad | Sí | text | — | Ej: Villa Carlos Paz |
| `w1_anio_inicio` | ¿En qué año empezó a operar? | Sí | year (1900–actual) | ≤ año actual | Deriva antigüedad. Ej: 2018 |
| `w1_forma_juridica` | Forma jurídica | No | select (Unipersonal/Monotributo/SRL/SA/SAS/Otra) | — | Ej: SRL |
| `w1_empleados` | ¿Cuántos empleados tenés (sin contar dueños)? | Sí | int (0–10000) | ≥0 | No cuentes a los dueños. Ej: 8 |
| `w1_duenos_trabajan` | ¿Cuántos dueños trabajan en el negocio? | Sí | int (0–20) | ≥0 | Clave para normalizar sueldos. Ej: 2 |
| `w1_local` | El local donde operás es… | Sí | select (Propio / Alquilado / No aplica) | — | Si "Propio" se pregunta luego si se incluye en la venta |

---

## 3.4 PASO W2 — Ventas

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w2_moneda` | ¿En qué moneda cargás los números? | Sí | select (ARS/USD) | — | Default ARS. Todo el wizard usa esta moneda; el motor la lleva a USD |
| `w2_carga_modo` | ¿Cómo querés cargar tus ventas? | Sí | select (Total anual / Mes a mes / Promedio mensual) | — | El dueño elige. Mes a mes detecta estacionalidad solo |
| `w2_ventas_a0` | Ventas de los últimos 12 meses | Sí (modo anual) | number$ | >0 | Facturación total sin IVA. Ej: 240.000.000 |
| `w2_ventas_meses[1..12]` | Ventas de cada mes | Sí (modo mensual) | number$ ×12 | ≥0 | Cargá los últimos 12 meses. Suma = ventas anuales |
| `w2_ventas_prom` | Ventas de un mes típico | Sí (modo promedio) | number$ | >0 | Se multiplica ×12. Ej: 20.000.000 |
| `w2_anio_representativo` | ¿El último año fue "normal"? | Sí | select (Sí / Fue mejor / Fue peor de lo normal) | — | Evita valuar sobre un año atípico |
| `w2_estacional` | ¿Tus ventas se concentran en ciertos meses? | Cond.* | bool (+ multiselect meses) | — | *Sólo si NO cargó mes a mes (si cargó mensual, se detecta) |
| `w2_concentracion_cliente` | ¿Tu cliente más grande qué % de las ventas representa? | No | percent (0–100) | 0–100 | Mucha concentración = más riesgo. Ej: 15% |

> **Decisión F3-A (cerrada):** **1 año** de ventas (los últimos 12 meses). No se promedian años anteriores por la distorsión inflacionaria; la comparabilidad se logra anclando en **USD** (Etapa 4). La tendencia futura se releva cualitativamente en W7.

---

## 3.5 PASO W3 — Costos y gastos
> Regla anti-doble-conteo: aquí **NO** se incluye lo que retiran los dueños (eso va en W4).

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w3_cogs_modo` | ¿Cómo cargás el costo de lo que vendés? | Sí | select (% de ventas / Monto anual) | — | Costo de mercadería o insumos |
| `w3_cogs_valor` | Costo de mercadería / insumos | Sí | percent **o** number$ (según modo) | %:0–100 / $≥0 | Lo que te cuesta lo que vendés, sin gastos fijos. Ej: 40% |
| `w3_gastos_modo` | ¿Cómo cargás los gastos fijos? | Sí | select (Total / Desglosado) | — | Sin contar retiros de dueños |
| `w3_alquiler` | Alquiler del local | Cond.* | number$ + period | ≥0 | *Obligatorio si `w1_local`=Alquilado. Ej: $1.200.000/mes |
| `w3_sueldos_empleados` | Sueldos de empleados (con cargas) | Cond.** | number$ + period | ≥0 | **Obligatorio si `w1_empleados`>0. No incluyas a los dueños |
| `w3_gastos_total` | Gastos fijos totales | (modo Total) | number$ + period | ≥0 | Todo lo que gastás para operar (sin retiros de dueños). Alternativa al desglose |

**Desglose guiado (modo Desglosado)** — checklist de categorías para que no se olvide ninguna importante; cada línea es opcional (0 si no aplica), con `period` mensual/anual:

| id | Categoría | Ejemplo |
|----|-----------|---------|
| `w3_g_alquiler` | Alquiler (si el local es alquilado) | Local, depósito |
| `w3_g_sueldos` | Sueldos de empleados (con cargas) | No incluye dueños |
| `w3_g_servicios` | Servicios | Luz, gas, agua, internet, teléfono |
| `w3_g_logistica` | Logística y fletes | Distribución, envíos, combustible |
| `w3_g_packaging` | Packaging / embalaje | Bolsas, cajas, etiquetas |
| `w3_g_publicidad` | Publicidad y marketing | Redes, Google, cartelería |
| `w3_g_comisiones` | Comisiones | Tarjetas, plataformas (MercadoLibre, apps), vendedores |
| `w3_g_impuestos` | Impuestos y tasas | IIBB, tasa municipal (no Ganancias) |
| `w3_g_seguros` | Seguros | Local, mercadería, ART |
| `w3_g_mantenimiento` | Mantenimiento y reparaciones | Equipos, local |
| `w3_g_honorarios` | Honorarios | Contador, legales |
| `w3_g_otros` | Otros gastos | Lo que no entró arriba |

> El sistema suma el desglose y muestra el total anual. Este total (o `w3_gastos_total`) es el que usa el motor.

---

## 3.6 PASO W4 — Normalización (convierte el resultado en EBITDA/SDE normalizado)
> El paso más importante para la precisión. Explica al usuario: *"Ajustamos tu resultado para reflejar cuánto gana realmente el negocio, separando lo tuyo como dueño."*

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w4_retiro_duenos` | ¿Cuánto retiran en total los dueños que trabajan? | Sí | number$ + period | ≥0 | Sueldos + retiros de TODOS los dueños. Ej: $2.000.000/mes |
| `w4_sueldo_mercado` | Si tuvieras que contratar a alguien que haga lo que hacés vos, ¿cuánto le pagarías? | Sí | number$ + period | ≥0 | Sueldo de mercado del puesto del dueño. Sugerencia por rubro/tamaño. Ej: $1.500.000/mes |
| `w4_gastos_personales` | ¿Pasás gastos personales por la empresa? ¿Cuánto por año? | No | number$ | ≥0 | Auto, celular, viajes, etc. Se suman de vuelta. Ej: $3.000.000/año |
| `w4_extraord_gasto` | Gastos por única vez en el último año | No | number$ | ≥0 | Juicio, mudanza, reparación grande. Ej: $5.000.000 |
| `w4_extraord_ingreso` | Ingresos por única vez en el último año | No | number$ | ≥0 | Venta de un activo, indemnización cobrada, etc. |

**Cálculo derivado (detalle en Etapa 4):**
`SDE = Ventas − COGS − GastosFijos(sin dueños) + GastosPersonales + ExtraordGasto − ExtraordIngreso`
`EBITDA_normalizado = SDE − SueldoMercadoDueño`
(SDE se usa para negocios chicos owner-operated; EBITDA para los más grandes.)

---

## 3.7 PASO W5 — Activos y capital de trabajo

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
**A. Capital de trabajo (lo que hace funcionar el negocio hoy)**

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w5_inventario` | Valor de tu stock/mercadería hoy | Cond.* | number$ | ≥0 | *Sólo rubros con stock. A precio de costo. Ej: $15.000.000 |
| `w5_inventario_minimo` | Stock mínimo para que el negocio funcione | No | number$ | ≥0 | Capital de trabajo básico que el comprador necesita sí o sí |
| `w5_por_cobrar` | ¿Cuánto te deben tus clientes hoy? | No | number$ | ≥0 | Cuentas por cobrar. Ej: $8.000.000 |
| `w5_por_pagar` | ¿Cuánto les debés a proveedores hoy? | No | number$ | ≥0 | Cuentas por pagar. Ej: $6.000.000 |

**B. Activos tangibles (a valor de mercado usado, no de compra)**

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w5_equipamiento` | Equipos, maquinaria, herramientas, mobiliario, rodados | Recom. | number$ | ≥0 | Todo lo físico que se incluye. Ej: $20.000.000 |
| `w5_inmueble_incluido` | ¿El inmueble propio se incluye en la venta? | Cond.** | bool | — | **Sólo si `w1_local`=Propio |
| `w5_inmueble_valor` | Valor estimado del inmueble | Cond. | number$ | ≥0 | Se valúa **aparte** del negocio (no se le aplica múltiplo) |

**C. Activos intangibles — "¿qué obtiene el comprador?"** (se listan y, si el dueño puede, se estiman; muchos suman valor cualitativo aunque no tengan precio)

| id | Etiqueta | Oblig. | Formato | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------------|
| `w5_intangibles` | ¿Qué intangibles se llevan con la empresa? | No | multiselect (Marca registrada, Página web, Redes sociales + seguidores, Cartera de clientes, Base de datos, Recetas/procesos propios, Licencias/habilitaciones, Contratos vigentes, Franquicia, Dominio web, Reputación/reseñas) | Ej: Marca registrada + Web + 30k seguidores IG |
| `w5_intangibles_detalle` | Detalle de los intangibles | No | textarea | Ej: "Marca registrada en INPI, web con e-commerce, 30k seguidores" |
| `w5_seguidores` | Seguidores en redes (total) | No | int | Señal de activo digital. Ej: 30000 |

**D. Qué se incluye en la operación**

| id | Etiqueta | Oblig. | Formato | Ayuda |
|----|----------|:---:|---------|-------|
| `w5_incluye_venta` | ¿Qué se incluye en la venta? | Sí | multiselect (Fondo de comercio, Stock, Equipos, Inmueble, Marca, Cartera de clientes, Empleados, Intangibles digitales) | Se reusa en la publicación y define el tipo de operación |

---

## 3.8 PASO W6 — Deudas

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w6_deuda_financiera` | Deudas con bancos o préstamos | No | number$ | ≥0 | Saldo total actual. Ej: $10.000.000 |
| `w6_deuda_otros` | Otras deudas (proveedores atrasados, AFIP, etc.) | No | number$ | ≥0 | Más allá del giro normal |
| `w6_contingencias` | ¿Tenés juicios o contingencias? | No | bool (+ number$ monto si Sí) | ≥0 | Ej: Sí — $4.000.000 |
| `w6_deuda_transfiere` | Las deudas, ¿las asume el comprador o quedan con vos? | Sí | select (Quedan con el dueño / Se transfieren) | — | Define si el precio es por activos o por la empresa completa |

---

## 3.9 PASO W7 — Perspectivas y riesgo

| id | Etiqueta | Oblig. | Formato | Validación | Ayuda / Ejemplo |
|----|----------|:---:|---------|-----------|-----------------|
| `w7_tendencia` | Mirando para adelante, tu negocio… | Sí | select (Va a crecer / Se mantiene / Va a bajar) | — | Prellenado con la tendencia histórica; puede cambiarlo |
| `w7_crecimiento_pct` | ¿Cuánto esperás crecer por año? (real, sin inflación) | No | percent (−50–100) | rango | Default por tendencia/rubro. Ej: 5% |
| `w7_dependencia_dueno` | Si el dueño se va, el negocio… | Sí | select (Sigue igual / Se complica un poco / Depende mucho de él) | — | Alta dependencia = más riesgo = menor valor |
| `w7_recurrencia` | ¿Tenés ventas recurrentes o contratos fijos? | No | bool | — | Clientes que vuelven / abonos. Baja el riesgo |
| `w7_riesgos` | Principales riesgos del negocio | No | multiselect (Pocos clientes, Depende del dueño, Competencia fuerte, Local alquilado clave, Estacional, Tecnología/regulación, Otro) | — | Ajusta la tasa de riesgo |
| `w7_motivo_venta` | ¿Por qué querés vender? | Sí | select (Retiro, Nuevo proyecto, Salud, Mudanza, Sociedad, Bajó la rentabilidad, Otro) | — | Se muestra en la publicación (señal para el comprador) |
| `w7_urgencia` | ¿Con qué urgencia querés vender? | No | select (Sin apuro / En 6 meses / Lo antes posible) | — | Uso interno / lead scoring |

---

## 3.10 Set mínimo vs. completo (barra de precisión)
- **Mínimo para calcular (rango amplio):** `elg_rubro`, `w2_ventas_a0`, `w3_cogs_valor`, gastos fijos (alquiler+sueldos+otros o total), `w4_retiro_duenos`, `w4_sueldo_mercado`, `w7_tendencia`, `w7_dependencia_dueno`.
- **Afinan el rango:** ventas históricas (a1,a2), año representativo, normalización completa (personales/extraordinarios), activos y capital de trabajo, deudas, concentración de clientes, recurrencia.
- La UI muestra **"Precisión de tu estimación: X%"** que sube al completar opcionales.

## 3.11 Validaciones cruzadas (coherencia) — soft salvo aclaración
| Regla | Tipo | Mensaje |
|-------|------|---------|
| COGS% + gastos fijos/ventas > 100% (pierde plata operativa) | Soft | "Según los números, el negocio estaría dando pérdida. ¿Es así?" → ruta activos |
| `w4_retiro_duenos` = 0 y `w1_duenos_trabajan` > 0 | Soft | "¿Los dueños no retiran nada? Cargá lo que se llevan para una mejor estimación" |
| `w2_ventas_a0` muy distinto de a1 (>±60%) sin marcar año atípico | Soft | "Hubo un cambio grande de ventas. ¿El último año fue normal?" |
| `w5_inventario` > `w2_ventas_a0` | Soft | "El stock parece muy alto respecto de tus ventas. ¿Está bien?" |
| Montos con más de X dígitos / negativos | Hard | Bloquea, formato inválido |
| Falta un obligatorio del paso | Hard | Bloquea avance |

## 3.12 Decisiones de la Etapa 3 — RESUELTAS
| ID | Decisión | Resolución |
|----|----------|-----------|
| **F3-A** | Años de ventas | **1 año** (últimos 12 meses). Sin promediar años (distorsión inflacionaria); comparabilidad vía USD. Carga flexible: anual / mes a mes / promedio. |
| **F3-B** | Catálogo de rubros | Lista **amplia** ("mejor de más que de menos, que nadie se sienta afuera"). Se arma en Etapa 4 con múltiplos y parámetros. |
| **F3-C** | Sueldo de mercado del dueño | **Se pide, con valor sugerido** por rubro/tamaño (editable). |
| **F3-D** | Período de carga | **Selector por campo** (mensual/anual) con anualización automática. |
| **F3-E** | Confianza en datos del dueño | **Avisar** cuando un valor se aparta mucho de lo típico y pedir confirmación; **mini-resumen tras cada paso**; datos "raros" **amplían el rango de incertidumbre** (no bloquean). |
| **F3-F** | Costos | **Checklist guiado** de categorías (logística, packaging, publicidad, comisiones, etc.) para no omitir gastos importantes. |
| **F3-G** | Activos | Tangibles **e intangibles** (marca, web, redes, cartera, licencias) + capital de trabajo mínimo, enfocado en "qué obtiene el comprador". |
