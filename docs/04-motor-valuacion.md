# Etapa 4 — Motor de Valuación — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
**Autor funcional:** Analista Financiero + Arquitecto. Todo parámetro numérico es **configurable por admin** (panel A2) y debe **calibrarse** con datos reales del mercado argentino antes de producción.
**Principio rector:** técnicamente sólido, **determinístico** (mismos datos → mismo resultado), con **guardas anti-error**, y explicable al dueño en criollo.

---

## 4.0 Decisiones de método (resumen)
El motor combina **tres enfoques** y los triangula:

1. **Múltiplos** (método primario) → valor = ganancia normalizada × múltiplo del rubro ajustado por riesgo.
2. **Flujo de fondos descontado simplificado / DCF** (secundario, para triangular y para mostrarle al usuario "su flujo de fondos").
3. **Valor por activos netos** (piso / floor, y método primario cuando el negocio no es rentable).

> **Por qué múltiplos como primario y no DCF:** en PyMEs el DCF es frágil (un dato mal cargado dispara el resultado). Los múltiplos por rubro reflejan lo que **realmente paga el mercado** y son más robustos. El DCF se usa para dar consistencia y credibilidad, no como verdad única.

---

## 4.1 Manejo de inflación y moneda (LA decisión de contexto argentino)

**Regla de oro: el motor razona en dólares reales (constantes). No proyecta pesos nominales con inflación.**

- Todos los montos que carga el usuario (en ARS o USD) se convierten a **USD** al **tipo de cambio de referencia** del panel admin (`tc_ref`, ej. dólar MEP o un blend definido por NexoNegocios).
- **No se promedian años en pesos** (la inflación los hace incomparables). Por eso el formulario pide **1 año** (últimos 12 meses) — Decisión F3-A.
- El crecimiento futuro (`w7_crecimiento_pct`) se pide **real** (sin inflación): "cuánto más vas a vender en términos reales". Así no mezclamos inflación en la proyección.
- La **tasa de descuento** del DCF es una tasa **real en USD** (build-up, §4.8), no una tasa nominal en pesos del 100%+.
- **Resultado mostrado en USD y ARS.** El ARS se calcula como `USD × tc_ref` al momento del informe, con nota: *"el equivalente en pesos varía con el tipo de cambio"*. El **valor ancla y estable es el USD**.

> Ventaja: coherencia temporal, comparabilidad entre empresas, y sintonía con cómo piensa el mercado argentino (todos hablan en dólares). El informe deja constancia del `tc_ref` usado y su fecha.

---

## 4.2 Base de ganancias: SDE y EBITDA normalizado
Construidos desde el formulario (todo en USD):

```
Ventas_anual                         (W2)
− Costo de mercadería/insumos (COGS) (W3)
− Gastos fijos operativos (sin dueños)(W3)
= Resultado operativo antes de dueño
+ Gastos personales pasados por la empresa (W4 addback)
+ Gastos extraordinarios (W4 addback)
− Ingresos extraordinarios (W4)
= SDE  (Seller's Discretionary Earnings — "lo que le queda a un dueño que trabaja")

EBITDA_normalizado = SDE − Sueldo de mercado del dueño (W4)
```

- **SDE**: base para micro/pequeñas (owner-operated). Refleja el ingreso total para un dueño que trabaja en el negocio.
- **EBITDA normalizado**: base para medianas (donde el comprador contrataría un gerente). Descuenta el costo de reemplazar al dueño.

**Guardas:** si algún componente falta, se usa 0 con aviso. Si `SDE ≤ 0` → ruta activos (§4.6). Márgenes fuera del rango típico del rubro → se amplía la incertidumbre (§4.13), no se bloquea.

---

## 4.3 Clasificación por tamaño (define qué base y qué múltiplo)
Por facturación anual en USD (parámetros admin, valores de arranque a calibrar):

| Clase | Facturación anual (USD) | Base de ganancia | Familia de múltiplo |
|-------|-------------------------|------------------|---------------------|
| **Micro** | < 150.000 | SDE | SDE bajo |
| **Pequeña** | 150.000 – 750.000 | SDE | SDE |
| **Mediana** | 750.000 – 3.000.000 | EBITDA norm. | EBITDA |
| **Grande** (fuera de foco) | > 3.000.000 | EBITDA norm. | → sugerir **Servicio Full** |

> Empresas "Grande" pueden igual usar el producto, pero se marca lead para el Full y se amplía el rango (menor confianza del modelo simplificado en ese tamaño).

---

## 4.4 Método de múltiplos (primario)

```
Múltiplo_final = clamp( Múltiplo_base(familia) × (1 + Σ ajustes), min_familia, max_familia )
Valor_operativo = Base_ganancia × Múltiplo_final
```

**Ajustes (cada uno suma/resta un % al múltiplo base; topes por ajuste):**

| Factor | Fuente | Efecto |
|--------|--------|--------|
| Tamaño | §4.3 | más grande → múltiplo mayor (+0% a +20%) |
| Crecimiento | `w7_tendencia`/`w7_crecimiento_pct` | crece → +; baja → − (−20% a +20%) |
| Dependencia del dueño | `w7_dependencia_dueno` | baja dep. → +10%; alta → −20% |
| Recurrencia de ingresos | `w7_recurrencia` | sí → +10% |
| Concentración de clientes | `w2_concentracion_cliente` | >30% en 1 cliente → −10% a −20% |
| Antigüedad | `w1_anio_inicio` | +años → +0% a +10% |
| Margen vs. típico del rubro | derivado | mejor margen → +; peor → − (±15%) |
| Calidad/《completitud》de datos | barra de precisión | no mueve el centro; **amplía el rango** (§4.13) |

Todos los ajustes están **acotados** y el múltiplo final se **clampea** al rango de la familia → nunca da un valor absurdo (guarda anti-error).

---

## 4.5 Flujo de fondos descontado simplificado (DCF) — secundario y "el flujo que ve el usuario"

```
FCF_0 = EBITDA_normalizado × (1 − t_efectiva)         (t_efectiva configurable, ~25–30%)
        − inversión_mantenimiento (capex_mant)         (% de ventas, por familia)
        − ΔCapital_de_trabajo                           (§4.10)

Proyección a 5 años con crecimiento real g (§4.9), con fade a g_terminal.
Descontar cada FCF_t a tasa real USD r (§4.8).
Valor terminal por MÚLTIPLO DE SALIDA (§4.11), no Gordon (más robusto en PyME).
Valor_DCF(operativo) = Σ VP(FCF_t) + VP(ValorTerminal)
```

Se muestra al usuario como una tabla de 5 años "así proyectamos el dinero que genera tu negocio" (transparencia = credibilidad).

**Guardas:** g se topea; si `r ≤ g_terminal` se fuerza método de salida por múltiplo (evita división por ~0). Si faltan datos para DCF → peso DCF = 0 (§4.7).

---

## 4.6 Valor por activos netos (piso, y primario si no hay rentabilidad)

```
Activos_netos = Equipamiento(mercado) + Inventario + Por_cobrar + Inmueble(si incluido)
                − Por_pagar − Deuda(si se transfiere) − Contingencias
```
- Actúa como **piso**: el negocio en marcha no debería valer menos que sus activos netos ajustados.
- Es el **método primario** cuando `SDE ≤ 0` o clase Micro con rentabilidad marginal (mensaje: *"hoy tu negocio se acerca al valor de sus activos"*).
- Intangibles (marca, web, cartera) se **listan** siempre; se suman al valor sólo si el dueño cargó un estimado creíble (por defecto aportan valor cualitativo, no numérico → evita inflar).

---

## 4.7 Combinación y selección de método (cuándo cada uno)

| Situación | Método primario | Combinación |
|-----------|-----------------|-------------|
| Rentable, datos suficientes (caso típico) | Múltiplos | `V = 0.60·V_múlt + 0.40·V_DCF`, con piso = activos netos |
| Rentable, datos DCF insuficientes | Múltiplos | `V = V_múlt` (peso DCF = 0), piso activos |
| Poco/no rentable (`SDE ≤ 0`) | Activos | `V = Activos_netos`; aviso claro |
| Asset-heavy (agro, inmobiliario, transporte pesado) | Máx(múltiplos, activos) | activos pesan más |
| Muy grande / compleja | Múltiplos + rango ampliado | + lead a Full |

Ponderaciones configurables. El **piso por activos** siempre aplica: `V_final = max(V_combinado, Activos_netos_si_going_concern)`.

**Anti-doble-conteo (regla clave):** el múltiplo de SDE/EBITDA ya incluye el equipamiento y el capital de trabajo "normal" necesarios para operar (negocio "llave en mano"). Por eso, sobre el valor por múltiplos **sólo se suma aparte**: inmueble propio incluido, activos no operativos, e inventario/CT **en exceso** del normal. El equipamiento operativo NO se suma de nuevo.

---

## 4.8 Tasa de descuento (real, USD) — método build-up

```
r = r_libre_USD + prima_riesgo_pais_AR + prima_tamaño + prima_especifica
```
Valores de arranque (admin, a calibrar):

| Componente | Arranque | Fuente/criterio |
|-----------|:---:|-----------------|
| `r_libre_USD` | 4.5% | Treasury largo |
| `prima_riesgo_pais_AR` | 9% | Riesgo país Argentina (configurable, alta volatilidad) |
| `prima_tamaño` | 4–8% | Menor = empresa más grande |
| `prima_especifica` | 0–6% | Dependencia dueño, concentración, sector |

→ Rango típico **r ≈ 18%–28% real USD**. Coherente con múltiplos de 3–5× (un 4× a perpetuidad sin crecimiento ≈ tasa 25%). Esta **coherencia múltiplo↔tasa** se valida en QA para que ambos métodos no se contradigan.

---

## 4.9 Estimación de crecimiento
- Fuente: `w7_tendencia` (crece/estable/baja) + `w7_crecimiento_pct` opcional (real).
- Default por tendencia: crece = +5% real, estable = 0%, baja = −5% (configurable por rubro).
- **Topes:** g_real ∈ [−10%, +15%]. **Fade** lineal hacia `g_terminal` (arranque 2.5% real) al año 5.
- Guarda: crecimiento alto no se sostiene a perpetuidad (evita sobrevaluar).

## 4.10 Capital de trabajo
- CT necesario ≈ `Inventario + Por_cobrar − Por_pagar` (si el usuario lo cargó) o estimado como `%_CT(familia) × Ventas`.
- En el DCF, `ΔCT = %_CT × ΔVentas` (crecer consume caja).
- **Exceso/faltante de CT** vs. el normal ajusta el valor por múltiplos (§4.7).

## 4.11 Valor terminal
- **Método de salida por múltiplo** (preferido): `TV = EBITDA_año5 × múltiplo_salida`, con `múltiplo_salida = múltiplo_base` (sin las primas de crecimiento, para conservadurismo).
- Alternativa Gordon sólo si `r > g_terminal + margen`: `TV = FCF_5·(1+g_t)/(r−g_t)`.
- TV se descuenta a valor presente. Guarda anti-división y anti-explosión.

## 4.12 Escenarios y rango (3 escenarios)
Se calcula un **valor puntual por escenario** variando 3 palancas simultáneamente:

| Palanca | Conservador | Base | Optimista |
|---------|:---:|:---:|:---:|
| Múltiplo | −1 nivel | base | +1 nivel |
| Crecimiento real | base −5pp | base | base +5pp |
| Tasa de descuento | +3pp | base | −3pp |

- **Valor orientativo (central) = escenario Base.**
- **Rango de valuación = [Conservador, Optimista].**
- Siempre se comunica el **rango**, nunca un único número (D4).

## 4.13 Manejo de la incertidumbre (ancho del rango)
El ancho del rango **no es fijo**: crece cuando hay más incertidumbre. Multiplicador de amplitud según:
- **Completitud de datos** (barra de precisión): menos datos → banda más ancha.
- **Datos atípicos** (F3-E): márgenes/valores fuera de lo típico → banda más ancha.
- **Riesgo del negocio**: alta dependencia del dueño, concentración, tamaño grande → más ancha.

```
half_width = base_width × f_completitud × f_atipicidad × f_riesgo
Rango = [Base × (1 − half_width), Base × (1 + half_width)]  (además acotado por escenarios)
```
Esto es **honesto y protege la marca**: a peor calidad de input, más explícita la incertidumbre.

## 4.14 Del valor del negocio al valor para el dueño (equity bridge)
```
Valor_operativo (going concern, por §4.7)
+ Inmueble propio incluido
+ Activos no operativos / exceso de CT
− Deuda financiera + otras deudas (SOLO si se transfieren al comprador)
− Contingencias (si se transfieren)
= VALOR ORIENTATIVO PARA EL DUEÑO  (rango + central, en USD y ARS)
```
Si las deudas **quedan con el dueño** (`w6_deuda_transfiere` = "quedan"), no se restan del precio (asset deal).

## 4.15 Catálogo de rubros → "familias de múltiplo"
Estrategia: **lista de rubros amplia** (que nadie quede afuera — decisión F3-B) mapeada a ~12 **familias de múltiplo** (parámetros manejables). Valores SDE de **arranque, a calibrar** (multiplican SDE para Micro/Pequeña; para Mediana se usa múltiplo EBITDA ≈ +1.0–1.5×):

| Familia | Múltiplo SDE (min/base/max) | Rubros que mapean (ejemplos) |
|---------|:---:|------------------------------|
| Servicios profesionales | 1.8 / 2.4 / 3.2 | Estudios contables, consultoras, agencias, arquitectura, legales |
| Gastronomía | 1.2 / 1.8 / 2.5 | Bar, restaurante, café, rotisería, fast food |
| Comercio minorista | 1.5 / 2.0 / 2.8 | Kiosco, indumentaria, ferretería, librería, dietética |
| Mayorista / distribución | 2.0 / 2.6 / 3.5 | Distribuidoras, corralón, importadores |
| Industria / manufactura | 2.2 / 3.0 / 4.2 | Metalúrgica, alimenticia, textil, plástica, imprenta |
| Salud y bienestar | 2.0 / 2.6 / 3.5 | Consultorios, centros médicos, laboratorios, ópticas |
| Tecnología / digital | 3.0 / 4.0 / 6.0 | Software, SaaS, apps, agencias digitales, e-learning |
| E-commerce | 1.8 / 2.4 / 3.5 | Tiendas online, dropshipping, marcas D2C |
| Logística / transporte | 2.0 / 2.8 / 4.0 | Fletes, mensajería, distribución, depósitos |
| Construcción / servicios de obra | 1.5 / 2.2 / 3.0 | Constructoras, instaladoras, corralón de servicios |
| Educación | 2.0 / 2.6 / 3.5 | Institutos, jardines, academias, capacitación |
| Belleza / estética / fitness | 1.3 / 1.9 / 2.8 | Peluquerías, spa, gimnasios, estética |
| Agro / producción primaria | activos + 2.5 / 3.0 / 4.0 | Campos, producción, agroindustria (asset-heavy) |
| Turismo / hotelería | activos + 2.0 / 2.8 / 4.0 | Hotel, hostel, agencia de viajes (asset-heavy) |
| Inmobiliario / rentas | mayormente activos | Alquileres, inmobiliarias |
| Otros / genérico | 1.5 / 2.2 / 3.0 | Fallback si no encaja |

> **A calibrar con NexoNegocios** (sos el experto del mercado local). El catálogo de rubros visible al usuario puede tener 40–60 opciones; cada una apunta a una familia.

## 4.16 Parámetros configurables (panel admin A2)
`tc_ref` y fecha · componentes de la tasa (§4.8) · múltiplos por familia · primas de ajuste · `t_efectiva` · `capex_mant %` · `%_CT` por familia · g defaults y topes · `g_terminal` · umbrales de tamaño · anchos de banda base · versión de parámetros (sellada en cada informe).

## 4.17 Casos borde y guardas anti-error
| Caso | Comportamiento |
|------|----------------|
| SDE/EBITDA ≤ 0 | Método activos; mensaje claro; no se aplica múltiplo negativo |
| División por cero (r≈g, ventas 0) | Se fuerza método de salida / se bloquea con validación |
| Múltiplo fuera de rango | clamp a min/max de familia |
| Valor por debajo del piso de activos | se eleva al piso |
| Datos incompletos | corre con set mínimo + banda ancha; barra de precisión baja |
| Inmueble muy grande vs. negocio | se reporta separado ("valor del negocio" vs "valor del inmueble") |
| Resultado negativo final | se muestra 0 + activos; nunca valor negativo al usuario |
| Moneda/tc faltante | usa `tc_ref` admin; nunca queda sin ancla |

## 4.18 Pipeline (pseudocódigo)
```
1. Normalizar inputs → USD con tc_ref.
2. Calcular SDE y EBITDA_normalizado (§4.2). Guardas.
3. Clasificar tamaño (§4.3) → elegir base y familia.
4. Múltiplos: múltiplo_final (ajustes + clamp) → V_múlt (§4.4).
5. DCF: FCF, proyección, TV por salida, descuento → V_DCF (§4.5) [si datos].
6. Activos netos → V_activos (piso) (§4.6).
7. Combinar según situación (§4.7) → V_central (going concern).
8. Equity bridge (§4.14) → Valor para el dueño.
9. Escenarios (§4.12) → [Conservador, Base, Optimista].
10. Incertidumbre (§4.13) → ancho de banda final.
11. Convertir a ARS con tc_ref. Sellar versión de parámetros + fecha.
12. Emitir: central, rango, tabla DCF, drivers, método usado.
```
**Determinismo:** sin aleatoriedad. Mismos inputs + misma versión de parámetros → mismo output (requisito de auditoría y de "no generar errores").

## 4.19 Decisiones de la Etapa 4 — RESUELTAS
| ID | Decisión | Resolución |
|----|----------|-----------|
| **M4-A** | Múltiplos por familia | **Aprobados** los de §4.15 como arranque; se calibran con datos reales de NexoNegocios antes de producción. |
| **M4-B** | `tc_ref` | **Dólar MEP**, configurable en admin. |
| **M4-C** | Ponderación múltiplos/DCF | **60/40**; DCF=0 si faltan datos. |
| **M4-D** | Riesgo país | Parámetro admin actualizable. |
| **M4-E** | Tabla DCF al usuario | **Sí**, en el informe pagado. |
| **M4-F** | Catálogo de rubros visibles | **Diferido a anexo** (`anexo-rubros.md`), se arma al final del diseño. |
