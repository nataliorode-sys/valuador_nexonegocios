# NexoDirecto — Documentación Funcional

Diseño completo del producto **NexoDirecto** (NexoNegocios): valuación express de autogestión + publicación en Marketplace + flyer, para dueños de empresas argentinas. Precio: $180.000 + IVA.

## Índice
| Doc | Contenido |
|-----|-----------|
| [`00-decisiones-clave.md`](00-decisiones-clave.md) | Registro maestro de decisiones (D1–D8, A2, F3, M4, R5, M6, FL7) |
| [`01-definicion-producto.md`](01-definicion-producto.md) | Objetivos, público, alcance, límites |
| [`02-arquitectura.md`](02-arquitectura.md) | Pantallas, flujo, estados, navegación, validaciones |
| [`03-formulario.md`](03-formulario.md) | Formulario campo por campo (7 pasos) |
| [`04-motor-valuacion.md`](04-motor-valuacion.md) | Algoritmo: múltiplos + DCF + activos, USD, escenarios |
| [`05-informe-pdf.md`](05-informe-pdf.md) | Informe PDF: secciones, gráficos, disclaimer |
| [`06-marketplace.md`](06-marketplace.md) | Publicación: público/privado, verificación, diferenciación |
| [`07-flyer.md`](07-flyer.md) | Flyer de difusión: formatos, estructura, plantillas |
| [`08-especificacion-claude-code.md`](08-especificacion-claude-code.md) | **Spec maestra**: datos, reglas, no-funcionales, stack, roadmap |
| [`anexo-rubros.md`](anexo-rubros.md) | (Pendiente) Catálogo de rubros → familias de múltiplo |

## Estado
Diseño funcional **completo** (Etapas 1–8). Pendiente de calibración antes de desarrollo: múltiplos con datos reales, anexo de rubros, guía visual de marca y textos legales.

## Cómo trabajar con esta doc
`08-especificacion-claude-code.md` es autocontenido y remite a los docs de detalle. El desarrollo sigue el roadmap por fases (§8.15), empezando por el **motor de valuación con tests** (Fase 1).
