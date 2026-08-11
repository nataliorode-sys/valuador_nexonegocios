# Etapa 2 — Arquitectura de la Aplicación — NexoDirecto

**Estado:** Borrador para revisión (v1.0)
Incorpora decisiones D1–D8 (`00-decisiones-clave.md`).

## 2.0 Principios de arquitectura
1. **Fricción mínima antes del paywall.** Sólo pedimos lo necesario para calcular el valor. Los datos de la publicación (fotos, textos, contacto) se piden **después de pagar**.
2. **El sistema calcula; el usuario responde en criollo.** Nunca se le pide EBITDA, tasa ni múltiplo.
3. **Guardado permanente.** El wizard es largo: autosave + retomar por email.
4. **Ancla en USD.** El motor razona en USD; muestra ARS y USD.
5. **Rango, nunca cifra única.** En pantalla, informe y flyer.
6. **Moderación antes de publicar.** Ninguna ficha llega al Marketplace sin aprobación de NexoNegocios.

## 2.1 Mapa de navegación (site map)

```
PÚBLICO (sin cuenta)
├── Landing NexoDirecto ...................... S1
├── Marketplace (listado) .................... S2
│    └── Ficha de empresa pública ............ S3
│         └── Contacto al vendedor (form relay) S3b
└── Registro / Login ....................... S4

PRIVADO (usuario logueado) — flujo de valuación (WIZARD LINEAL)
├── Elegibilidad / Screening ................ S5
├── Wizard de carga (7 pasos) ............... W1..W7
├── Cálculo (procesando) .................... S6
├── Resultado TEASER (gratis, sin el número)  S7  ← PAYWALL
├── Checkout / Pago ......................... S8
├── Resultado COMPLETO ...................... S9
├── Armado de publicación ................... S10
├── Vista previa ficha + flyer .............. S11
└── Envío a revisión ....................... S12

PRIVADO — gestión (DASHBOARD HUB-AND-SPOKE)
├── Panel / Mis valuaciones ................. S13
│    ├── Detalle de una valuación/publicación  S13a
│    ├── Contactos recibidos (leads) ......... S14
│    ├── Descargas (informe PDF / flyer) ...... —
│    ├── Renovar publicación .................. S15
│    └── Upsell a Servicio Full ............... S16
└── Cuenta / Datos / Facturación ............ S17

ADMIN (NexoNegocios) — backoffice
├── Cola de moderación ...................... A1
├── Parámetros del motor (tasas, múltiplos, TC) A2
├── Gestión de publicaciones y usuarios ...... A3
└── Métricas y leads para el Full ........... A4
```

## 2.2 Flujo completo del usuario (end-to-end)

```
Comprador:            S2 → S3 → S3b (contacta) → [email al vendedor]

Vendedor:
S1 Landing
  → S4 Registro/Login
    → S5 Elegibilidad (rubro, antigüedad, ¿en marcha?, ¿rentable?)
        ├─ fuera de foco / muy grande → sugerir Servicio Full (lead) — puede seguir igual
        └─ ok →
    → W1..W7 Wizard (autosave en cada paso)
      → S6 Cálculo
        → S7 TEASER (ve que está listo + adelanto, NO el valor)  ◀── PAYWALL
          ├─ abandona → email de retoma (borrador guardado)
          └─ paga →
            → S8 Checkout (Mercado Pago) → factura
              → S9 Resultado completo (valor, rango ARS/USD, escenarios, PDF)
                → S10 Armado de publicación (título, descripción, fotos, contacto, precio a publicar)
                  → S11 Vista previa (ficha + flyer)
                    → S12 Envío a revisión  → [A1 Moderación NexoNegocios]
                        ├─ aprobada → PUBLICADA (100 días) + notificación + flyer disponible
                        └─ rechazada → motivo → corregir/reenviar o cerrar
                          → S13 Dashboard (gestión, leads, renovación, upsell)
```

## 2.3 Máquina de estados de una Valuación/Publicación

```
BORRADOR ──(completa wizard)──> CALCULADA ──(paga)──> PAGA
   ▲                                                    │
   │(retoma)                                            ▼
   └───────────                              PUBLICACION_EN_ARMADO
                                                        │(envía a revisión)
                                                        ▼
                                                   EN_REVISION
                                        ┌───────────────┴───────────────┐
                                   (aprueba)                        (rechaza)
                                        ▼                                ▼
                                   PUBLICADA ◀──(renueva)──┐         RECHAZADA
                             ┌──────┼───────┐              │        (motivo; puede
                        (100 días) (vende) (pausa)         │         corregir→EN_REVISION)
                             ▼      ▼        ▼              │
                          VENCIDA  VENDIDA  PAUSADA ───────┘
```

Notas:
- **CALCULADA → PAGA:** el motor ya corrió en S6 (para el teaser); el pago sólo **desbloquea** el resultado. No se recalcula salvo que el usuario edite datos.
- **PAGA:** deliverables núcleo (valor + informe PDF) quedan disponibles aunque el usuario nunca publique.
- **RECHAZADA:** sólo la *publicación* se rechaza (contenido). El informe pagado sigue siendo válido. Política de reembolso = **Decisión abierta A2-D**.
- **VENCIDA/VENDIDA/PAUSADA:** salen del Marketplace; el usuario puede renovar (pago) o reactivar.

## 2.4 Inventario de pantallas

| ID | Pantalla | Propósito | Contenido clave | Acciones | Acceso | Estado |
|----|----------|-----------|-----------------|----------|--------|--------|
| S1 | Landing NexoDirecto | Explicar y convertir | Qué es, diferencia con Full (D7), precio, ejemplo de informe, CTA | "Valuá tu empresa" | Público | — |
| S2 | Marketplace | Compradores navegan | Grilla de empresas; filtros (rubro, ubicación, rango precio, tipo); **badge NexoDirecto vs Intermediada** | Filtrar, abrir ficha | Público | — |
| S3 | Ficha pública | Mostrar una empresa | Datos públicos (ver Etapa 6), disclaimer NexoDirecto | Contactar | Público | PUBLICADA |
| S3b | Contacto al vendedor | Relay de lead | Form (nombre, contacto, mensaje) | Enviar | Público | — |
| S4 | Registro / Login | Cuenta e identidad | Email + password / magic link; verificación email | Crear cuenta, ingresar | Público→Priv | — |
| S5 | Elegibilidad | Fijar expectativas y rutear | Rubro, antigüedad, ¿en marcha?, ¿rentable?, ¿tiene los números? | Continuar / ver Full | Privado | BORRADOR |
| W1 | Identidad del negocio | Contexto | Rubro, ubicación, antigüedad, modelo, empleados | Guardar/Sig. | Privado | BORRADOR |
| W2 | Ventas | Ingresos y tendencia | Facturación 2–3 años, tendencia, estacionalidad, moneda | Guardar/Sig. | Privado | BORRADOR |
| W3 | Costos y gastos | Estructura de costos | Costo de mercadería/servicio, gastos fijos, sueldos | Guardar/Sig. | Privado | BORRADOR |
| W4 | Normalización | Ajustes al resultado | Retiros del dueño, sueldo de mercado del dueño, gastos personales, extraordinarios | Guardar/Sig. | Privado | BORRADOR |
| W5 | Activos y capital de trabajo | Balance simplificado | Inventario, por cobrar/pagar, equipos/maquinaria, inmueble (propio/alquilado) | Guardar/Sig. | Privado | BORRADOR |
| W6 | Deudas | Pasivos | Deudas financieras, con proveedores, contingencias | Guardar/Sig. | Privado | BORRADOR |
| W7 | Perspectivas | Ajuste de riesgo/crecimiento | Crecimiento esperado, dependencia del dueño, riesgos, motivo de venta | Calcular | Privado | BORRADOR |
| S6 | Cálculo | Procesamiento | Animación + "analizando tu empresa" | — (auto) | Privado | →CALCULADA |
| S7 | Resultado TEASER | Convertir a pago | Metodología, adelanto parcial, informe borroso, **valor oculto**, CTA pagar | Pagar | Privado | CALCULADA |
| S8 | Checkout | Cobrar | Resumen del paquete, precio, Mercado Pago, datos de factura | Pagar | Privado | →PAGA |
| S9 | Resultado completo | Entregar valor | Valor orientativo, rango ARS/USD, 3 escenarios, gráficos, drivers, descargar PDF | Descargar, Publicar | Privado | PAGA |
| S10 | Armado de publicación | Construir ficha | Título, descripción, motivo, qué incluye, condiciones, fotos/logo, contacto, **precio a publicar** (sugerido, decide el dueño), público/privado por campo | Guardar/Sig. | Privado | PUBLICACION_EN_ARMADO |
| S11 | Vista previa | Validar salida | Preview ficha + preview flyer | Editar, Enviar a revisión | Privado | PUBLICACION_EN_ARMADO |
| S12 | Envío a revisión | Moderación | Aceptar términos, disclaimer | Confirmar | Privado | →EN_REVISION |
| S13 | Panel / Mis valuaciones | Hub de gestión | Lista con estado, días restantes, leads, acciones | Abrir, renovar, upsell | Privado | cualquiera |
| S13a | Detalle | Gestión de una | Estado, informe, flyer, ficha, leads, editar | — | Privado | cualquiera |
| S14 | Contactos (leads) | Ver interesados | Lista de contactos recibidos (nombre, mensaje, fecha) | Responder por fuera | Privado | PUBLICADA |
| S15 | Renovar | Reactivar 100 días | Resumen, pago | Pagar | Privado | VENCIDA→PUBLICADA |
| S16 | Upsell Servicio Full | Escalar al premium | Beneficios del Full, contacto con asesor | Solicitar contacto | Privado | — |
| S17 | Cuenta | Datos y facturación | Perfil, comprobantes, seguridad | Editar | Privado | — |
| A1 | Cola de moderación | Aprobar/rechazar | Fichas EN_REVISION, checklist | Aprobar/Rechazar+motivo | Admin | — |
| A2 | Parámetros del motor | Mantener el modelo | Tipo de cambio, múltiplos por rubro, tasas, macro | Editar | Admin | — |
| A3 | Gestión | Operación | Usuarios, publicaciones, extensiones | CRUD | Admin | — |
| A4 | Métricas y leads | Negocio | Ventas, conversión, leads Full | Ver/Exportar | Admin | — |

## 2.5 Estructura del Wizard (7 pasos) — resumen
Los campos exactos se definen en la **Etapa 3**. Agrupación propuesta:

1. **W1 Identidad** — quién sos y qué hacés.
2. **W2 Ventas** — cuánto vendés y cómo evoluciona.
3. **W3 Costos y gastos** — cuánto te cuesta operar.
4. **W4 Normalización** — sueldos del dueño, gastos personales, extraordinarios (clave para EBITDA normalizado).
5. **W5 Activos y capital de trabajo** — qué tenés (inventario, equipos, inmueble, cuentas).
6. **W6 Deudas** — qué debés.
7. **W7 Perspectivas** — hacia dónde va y de qué depende.

Barra de progreso persistente (paso X de 7), botón "Guardar y seguir después", tiempo estimado visible ("~15 min").

## 2.6 Navegación y reglas
- **Wizard = lineal** con avance/retroceso; no se saltean pasos obligatorios.
- **Dashboard = hub-and-spoke**; se accede a cada valuación y sus sub-secciones.
- **Público** (Marketplace) navegable sin cuenta; contactar puede requerir datos mínimos del comprador (sin cuenta).
- Menú contextual según estado: en BORRADOR el CTA es "Continuar valuación"; en PUBLICADA es "Ver publicación / leads".
- Deep-linking a cada paso del wizard para retomar por email.

## 2.7 Validaciones (filosofía; detalle por campo en Etapa 3)
- **Dos niveles:**
  - **Hard (bloquea):** obligatorios, formato (número, moneda, %), rangos imposibles (negativos donde no corresponde).
  - **Soft (advierte, deja seguir):** valores atípicos o incoherencias (p. ej. costos ≈ ventas, margen fuera de lo típico del rubro). Se muestra alerta y el usuario **confirma**; queda registrado "dato atípico confirmado".
- **Validaciones cruzadas (coherencia financiera):** ventas ≥ costos; suma de componentes; EBITDA implícito plausible; capital de trabajo vs. ventas; deuda vs. activos.
- **Rutas especiales del motor** (se resuelven en Etapa 4):
  - EBITDA normalizado **negativo/cero** → no se valúa por rentabilidad; se orienta por **activos netos** + aviso.
  - Empresa **muy grande o compleja** → se sugiere **Servicio Full** (lead) sin bloquear.
- **Autosave** al cambiar de paso y cada N segundos.
- **Idempotencia del cálculo:** mismos datos → mismo resultado (sin aleatoriedad); versión de parámetros del motor sellada en el informe.

## 2.8 Manejo de errores y edge cases
| Caso | Comportamiento |
|------|----------------|
| Abandono del wizard | Borrador guardado + email de retoma con deep-link |
| Pago fallido/pendiente | Estado PAGO_PENDIENTE; reintento; libera al confirmarse |
| Empresa no rentable | Ruta activos + mensaje claro + sugerencia Full |
| Empresa fuera de rango del motor | Orientación con banda ampliada + sugerencia Full |
| Rechazo en moderación | Motivo; corregir y reenviar (si es subsanable) o cerrar (si es contenido inapropiado) |
| Vencimiento a 100 días | Notificación previa (día 90 y 99) + opción de renovar |
| Edición de datos post-pago | Recalcula y **re-versiona** el informe (marca "actualizado") |

## 2.9 Decisiones de la Etapa 2 — RESUELTAS
> Ver resoluciones definitivas en `00-decisiones-clave.md` (A2-A … A2-F). Resumen: cuenta tras elegibilidad con autoguardado/retoma; teaser = resumen de lo cargado + imágenes borrosas sin valores (sin semáforo); moderación 100% manual; **con** reembolso si se rechaza; precio lo fija el dueño con advertencia; contacto = relay + revelado de WhatsApp/email.

### (histórico) Decisiones abiertas planteadas
| ID | Decisión | Recomendación del equipo |
|----|----------|--------------------------|
| **A2-A** | Momento de creación de cuenta | **Después de S5 (elegibilidad), antes del wizard**, para poder autoguardar y enviar email de retoma. Registro liviano (email + password o magic link). |
| **A2-B** | Qué mostrar en el TEASER gratuito (S7) | Mostrar: metodología, que el informe está listo, **1 dato cualitativo** (ej. "tu principal driver de valor es tu rentabilidad / tu inventario") y páginas del informe borrosas. **Ocultar el valor y el rango.** No mostrar EBITDA (permite estimar el valor). |
| **A2-C** | Contacto comprador→vendedor | **Form relay** (el comprador escribe, le llega al vendedor por email y queda como lead en S14). Protege el mail del vendedor y permite medir/upsell. |
| **A2-D** | Reembolso si se rechaza la publicación | Si el rechazo es por **contenido inapropiado/ilegal** (culpa del usuario, violó términos): **sin reembolso**, el informe ya fue entregado. Si es **subsanable**: corrige y reenvía. A validar legalmente. |
| **A2-E** | Precio a publicar | Lo **decide el dueño** (D4/D7), con el rango del sistema como **sugerencia**. El sistema puede advertir si se aparta mucho del rango. |
