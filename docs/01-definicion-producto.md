# Etapa 1 — Definición del Producto — NexoDirecto

**Producto:** NexoDirecto (preliminar) · **Precio:** $180.000 + IVA · **Mercado:** Argentina
**Estado:** Cerrada (v1.1, incorpora feedback del cliente)

## 1. Una frase
Aplicación web de autogestión que permite al dueño de una empresa argentina —de cualquier rubro o tamaño— obtener una **orientación de valuación** con informe PDF, publicarla 100 días en el Marketplace de NexoNegocios y generar un flyer de difusión, con **contacto directo** vendedor↔comprador y **sin intermediación** de NexoNegocios.

## 2. Objetivos
**Negocio:** (O1) monetizar el segmento que no toma el servicio Full; (O2) ofrecer una escalera de servicios ("un servicio para cada tipo") que además funciona como funnel al Full; (O3) alimentar el Marketplace con inventario; (O4) escalar sin costo marginal de analista; (O5) construir base de datos propietaria de PyMEs y sus métricas.
**Usuario:** saber cuánto vale su empresa, publicarla rápido, tener un documento con respaldo para mostrar a interesados.

## 3. Público objetivo
Dueño/socio de empresa **real y en marcha**, de cualquier rubro y tamaño, típicamente PyME, que quiere valuar y/o vender por su cuenta sin la complejidad del servicio Full. Perfil **no financiero**: el sistema calcula, el usuario sólo responde en lenguaje llano.
**No es para:** empresas de contenido ilegal/inapropiado; quien busca una valuación con validez legal/pericial (esto no lo es).

## 4. Casos de uso
UC1 saber cuánto vale · UC2 publicar para vender · UC3 difundir con flyer · UC4 comprador busca y contacta · UC5 empezar y decidir en el paywall · UC6 NexoNegocios detecta y modera casos + capta leads para el Full.

## 5. Alcance
**Incluye (v1):** cuenta de usuario; wizard de carga; motor de valuación (flujo de fondos simplificado + múltiplos + EBITDA normalizado); teaser gratuito + paywall; resultado completo (rango ARS/USD, escenarios); informe PDF; datos de publicación; **moderación NexoNegocios**; publicación 100 días; flyer; contacto directo; panel del usuario; Marketplace público con diferenciación NexoDirecto vs. Intermediadas.
**No incluye:** validez legal/pericial; verificación/auditoría de datos; intervención en la negociación/cierre; escrow/firma; app nativa; integración contable/AFIP (v2); garantía de venta o de precio; republicación automática tras 100 días (renovación paga).

## 6. Limitaciones y salvaguardas (no negociables)
Datos **autodeclarados no verificados** → el informe nunca dice "vale $X"; dice **"orientación express basada en datos provistos por el propietario, sin verificación de NexoNegocios"**; siempre **rango**; disclaimer con checkbox registrado antes de generar. Ancla en **USD** por contexto macro argentino; parámetros macro configurables por admin. Rol de NexoNegocios = **plataforma y orientación**, no asesor; la decisión del valor publicado y el éxito de la venta dependen del dueño.

## 7. Incluye / No incluye (comercial)
Ver `00-decisiones-clave.md` (D1–D8). Diferenciación de Marketplace = D7.

Decisiones que rigen esta etapa: **D1–D8** en `00-decisiones-clave.md`.
