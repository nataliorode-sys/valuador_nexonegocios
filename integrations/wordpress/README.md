# Integración WordPress — NexoDirecto en "Empresas en venta"

Muestra las publicaciones del marketplace **NexoDirecto** dentro de
`nexonegocios.com.ar/empresas-en-venta/`, en una **sección separada** debajo de
tus oportunidades exclusivas/intermediadas. Las tarjetas son deliberadamente más
simples y compactas que las fichas premium, para mantener la diferencia de tier.

Se compone de dos piezas:

1. **API pública** en la app (este repo): `GET /api/publicaciones`
   → `web/app/api/publicaciones/route.ts`. Ya queda disponible al deployar la app.
2. **Plugin de WordPress**: `nexodirecto-listados/` → aporta el shortcode
   `[nexodirecto]`.

---

## 1) Verificar la API

Una vez deployada la app, abrí en el navegador:

```
https://nexodirecto.nexonegocios.com.ar/api/publicaciones
```

Debe responder un JSON con `{ "ok": true, "items": [ ... ] }`. Si es así, la
API está lista. (Devuelve las mismas publicaciones que el marketplace: aprobadas
por moderación, publicadas y no vencidas.)

## 2) Instalar el plugin en WordPress

1. Comprimí la carpeta `nexodirecto-listados/` en un `.zip`
   (que adentro quede `nexodirecto-listados/nexodirecto-listados.php`).
2. En WordPress: **Plugins → Añadir nuevo → Subir plugin** → elegí el `.zip` →
   **Instalar** → **Activar**.
3. Andá a **Ajustes → NexoDirecto** y confirmá la **URL base de la app**
   (por defecto `https://nexodirecto.nexonegocios.com.ar`). Guardá.

## 3) Colocar el shortcode

Editá la página **Empresas en venta**. Debajo de tu bloque HTML de oportunidades
exclusivas, agregá un bloque (Shortcode o HTML) con:

```
[nexodirecto]
```

Listo: aparece la sección de NexoDirecto, autoactualizada desde la app.

### Atributos opcionales

```
[nexodirecto limit="24" columnas="4"
             titulo="NexoDirecto"
             subtitulo="Publicaciones directas de sus titulares · contacto sin intermediación"]
```

- `limit` — máximo de publicaciones a mostrar (default 24, tope 100).
- `columnas` — columnas en escritorio (2 a 5, default 4). Más columnas = tarjetas
  más chicas.
- `titulo` / `subtitulo` — textos del encabezado de la sección.
- `api` — sobreescribe la URL base solo para ese shortcode (normalmente no hace
  falta; usá Ajustes → NexoDirecto).

---

## Cómo funciona

- El plugin llama a la API **desde el servidor** (no desde el navegador), así que
  no hay problemas de CORS ni de mezclar dominios.
- El resultado se **cachea 5 minutos** (transient de WordPress), alineado con el
  cache de la API. Para forzar la actualización, abrí la página con
  `?nd_refresh=1` estando logueado como administrador.
- Si la API llegara a fallar, el plugin muestra la **última copia buena** que
  tenga guardada (hasta 24 h), para no romper la página.
- Los filtros (rubro y provincia) se generan solos según las publicaciones que
  haya, y filtran **solo** las tarjetas de NexoDirecto (no tocan tu bloque de
  exclusivas).
- Las fichas se abren en la app: `…/empresa/{codigo}`.

## Diferencia de diseño (intencional)

| | Exclusivas (tu HTML) | NexoDirecto (plugin) |
|---|---|---|
| Prefijo CSS | `.nx-*` | `.ndx-*` |
| Grilla | 3 columnas | 4 columnas (más densa) |
| Tarjeta | grande, sombra marcada | compacta, borde fino |
| Ficha | página premium en WordPress | ficha del marketplace en la app |
| Distintivo | "Disponible" | chip "NexoDirecto" |

Los dos bloques conviven en la misma página sin pisarse los estilos.
