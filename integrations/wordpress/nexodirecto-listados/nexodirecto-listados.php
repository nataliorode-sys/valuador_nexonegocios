<?php
/**
 * Plugin Name:       NexoDirecto — Listados
 * Plugin URI:        https://nexonegocios.com.ar
 * Description:        Muestra las publicaciones del marketplace NexoDirecto dentro de una página de WordPress mediante el shortcode [nexodirecto]. Pensado para una sección separada, debajo de las oportunidades exclusivas/intermediadas.
 * Version:           1.1.0
 * Author:            NexoNegocios
 * License:           GPL-2.0-or-later
 * Text Domain:       nexodirecto-listados
 *
 * Uso: colocá el shortcode [nexodirecto] en la página "Empresas en venta",
 * debajo de tu bloque HTML de oportunidades exclusivas.
 *
 * Atributos opcionales del shortcode:
 *   [nexodirecto api="https://nexodirecto.nexonegocios.com.ar" limit="24" columnas="4"
 *                titulo="NexoDirecto" subtitulo="Contacto directo con el titular"]
 */

if (!defined('ABSPATH')) {
    exit; // Sin acceso directo.
}

define('NDX_VERSION', '1.1.0');
define('NDX_DEFAULT_API', 'https://nexodirecto.nexonegocios.com.ar');
define('NDX_CACHE_TTL', 5 * MINUTE_IN_SECONDS); // Coincide con el s-maxage de la API.

/* -------------------------------------------------------------------------
 * Ajustes (Ajustes → NexoDirecto): base de la API.
 * ---------------------------------------------------------------------- */

add_action('admin_menu', function () {
    add_options_page(
        'NexoDirecto',
        'NexoDirecto',
        'manage_options',
        'nexodirecto-listados',
        'ndx_render_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('ndx_settings', 'ndx_api_base', [
        'type'              => 'string',
        'sanitize_callback' => function ($v) {
            $v = esc_url_raw(trim((string) $v));
            return rtrim($v, '/');
        },
        'default'           => NDX_DEFAULT_API,
    ]);
});

function ndx_api_base(): string
{
    $v = get_option('ndx_api_base', NDX_DEFAULT_API);
    $v = is_string($v) ? rtrim(trim($v), '/') : '';
    return $v !== '' ? $v : NDX_DEFAULT_API;
}

function ndx_render_settings_page(): void
{
    ?>
    <div class="wrap">
        <h1>NexoDirecto — Listados</h1>
        <form method="post" action="options.php">
            <?php settings_fields('ndx_settings'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="ndx_api_base">URL base de la app NexoDirecto</label></th>
                    <td>
                        <input name="ndx_api_base" id="ndx_api_base" type="url" class="regular-text"
                               value="<?php echo esc_attr(ndx_api_base()); ?>"
                               placeholder="<?php echo esc_attr(NDX_DEFAULT_API); ?>" />
                        <p class="description">
                            Dominio donde corre la app (sin barra final). La API que consume el plugin es
                            <code><?php echo esc_html(ndx_api_base() . '/api/publicaciones'); ?></code>.
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <hr>
        <h2>Cómo usarlo</h2>
        <p>Pegá el shortcode <code>[nexodirecto]</code> en la página <em>Empresas en venta</em>,
           debajo de tu bloque de oportunidades exclusivas.</p>
        <p>El listado se cachea <?php echo (int) (NDX_CACHE_TTL / MINUTE_IN_SECONDS); ?> minutos.
           Para forzar la actualización, abrí la página con <code>?nd_refresh=1</code> (como administrador).</p>
    </div>
    <?php
}

/* -------------------------------------------------------------------------
 * Traer publicaciones desde la API (server-side, con caché en transient).
 * ---------------------------------------------------------------------- */

function ndx_fetch(int $limit): array
{
    $endpoint = add_query_arg(['limit' => $limit], ndx_api_base() . '/api/publicaciones');

    $refresh = current_user_can('manage_options') && isset($_GET['nd_refresh']);
    $cache_key = 'ndx_data_' . md5($endpoint);

    if (!$refresh) {
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }
    }

    $res = wp_remote_get($endpoint, [
        'timeout' => 8,
        'headers' => ['Accept' => 'application/json'],
    ]);

    if (is_wp_error($res) || (int) wp_remote_retrieve_response_code($res) !== 200) {
        // Si falla, servir lo último bueno que haya (aunque esté vencido) para no romper la página.
        $stale = get_transient($cache_key . '_stale');
        return is_array($stale) ? $stale : ['ok' => false, 'items' => [], 'filtros' => ['rubros' => [], 'provincias' => []]];
    }

    $data = json_decode(wp_remote_retrieve_body($res), true);
    if (!is_array($data) || empty($data['ok'])) {
        $stale = get_transient($cache_key . '_stale');
        return is_array($stale) ? $stale : ['ok' => false, 'items' => [], 'filtros' => ['rubros' => [], 'provincias' => []]];
    }

    set_transient($cache_key, $data, NDX_CACHE_TTL);
    set_transient($cache_key . '_stale', $data, DAY_IN_SECONDS); // respaldo por si la API cae
    return $data;
}

/* -------------------------------------------------------------------------
 * Shortcode [nexodirecto]
 * ---------------------------------------------------------------------- */

add_shortcode('nexodirecto', 'ndx_shortcode');

function ndx_shortcode($atts): string
{
    $a = shortcode_atts([
        'limit'     => 24,
        'columnas'  => 4,
        'titulo'    => 'NexoDirecto',
        'subtitulo' => 'Publicaciones directas de sus titulares · contacto sin intermediación',
    ], $atts, 'nexodirecto');

    $limit    = max(1, min(100, (int) $a['limit']));
    $columnas = max(2, min(5, (int) $a['columnas']));

    $data  = ndx_fetch($limit);
    $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
    $rubros = isset($data['filtros']['rubros']) && is_array($data['filtros']['rubros']) ? $data['filtros']['rubros'] : [];
    $provincias = isset($data['filtros']['provincias']) && is_array($data['filtros']['provincias']) ? $data['filtros']['provincias'] : [];

    ob_start();
    ndx_styles($columnas);
    ?>
    <section class="ndx">
      <div class="ndx-wrap">
        <header class="ndx-head">
          <p class="ndx-eye"><?php echo esc_html($a['titulo']); ?></p>
          <h2 class="ndx-title">Empresas publicadas en NexoDirecto</h2>
          <p class="ndx-sub"><?php echo esc_html($a['subtitulo']); ?></p>
        </header>

        <?php if (empty($items)) : ?>
          <div class="ndx-empty">Por el momento no hay publicaciones activas en NexoDirecto.</div>
        <?php else : ?>

          <?php if (!empty($rubros) || !empty($provincias)) : ?>
          <div class="ndx-filters">
            <div class="ndx-pills">
              <button class="ndx-pill is-active" data-familia="all">Todas</button>
              <?php foreach ($rubros as $r) : ?>
                <button class="ndx-pill" data-familia="<?php echo esc_attr($r['value']); ?>"><?php echo esc_html($r['label']); ?></button>
              <?php endforeach; ?>
            </div>
            <?php if (!empty($provincias)) : ?>
            <select class="ndx-prov">
              <option value="all">Todas las provincias</option>
              <?php foreach ($provincias as $p) : ?>
                <option value="<?php echo esc_attr($p['value']); ?>"><?php echo esc_html($p['label']); ?></option>
              <?php endforeach; ?>
            </select>
            <?php endif; ?>
          </div>
          <?php endif; ?>

          <div class="ndx-grid">
            <?php foreach ($items as $it) :
              $rubro = isset($it['rubro']) ? $it['rubro'] : '';
              $ubic  = isset($it['ubicacion']) ? $it['ubicacion'] : '';
              $meta  = trim($rubro . ($ubic ? ' · ' . $ubic : ''));
              $hl    = isset($it['highlights'][0]) ? $it['highlights'][0] : '';
            ?>
            <article class="ndx-card"
                     data-familia="<?php echo esc_attr($it['familia'] ?? ''); ?>"
                     data-provincia="<?php echo esc_attr($it['provincia'] ?? ''); ?>">
              <a class="ndx-link" href="<?php echo esc_url($it['url'] ?? '#'); ?>">
                <div class="ndx-media">
                  <?php if (!empty($it['foto'])) : ?>
                    <img loading="lazy" src="<?php echo esc_url($it['foto']); ?>" alt="<?php echo esc_attr($it['titulo'] ?? ''); ?>">
                  <?php else : ?>
                    <div class="ndx-noimg">🏢</div>
                  <?php endif; ?>
                  <span class="ndx-badge">NexoDirecto</span>
                </div>
                <div class="ndx-body">
                  <?php if ($meta) : ?><p class="ndx-meta"><?php echo esc_html($meta); ?></p><?php endif; ?>
                  <h3 class="ndx-name"><?php echo esc_html($it['titulo'] ?? ''); ?></h3>
                  <?php if ($hl) : ?><p class="ndx-hl">✓ <?php echo esc_html($hl); ?></p><?php endif; ?>
                  <div class="ndx-foot">
                    <span class="ndx-price"><?php echo esc_html($it['precioLabel'] ?? ''); ?></span>
                    <span class="ndx-arrow">→</span>
                  </div>
                </div>
              </a>
            </article>
            <?php endforeach; ?>
          </div>

          <p class="ndx-noresults" hidden>No hay publicaciones que coincidan con el filtro.</p>
        <?php endif; ?>
      </div>
    </section>

    <script>
    (function () {
      var root = document.currentScript.previousElementSibling;
      if (!root || !root.classList.contains('ndx')) {
        var all = document.querySelectorAll('.ndx'); root = all[all.length - 1];
      }
      if (!root) return;
      var pills = root.querySelectorAll('.ndx-pill');
      var prov  = root.querySelector('.ndx-prov');
      var cards = root.querySelectorAll('.ndx-card');
      var none  = root.querySelector('.ndx-noresults');
      var fFam = 'all', fProv = 'all';
      function apply() {
        var visibles = 0;
        cards.forEach(function (c) {
          var okF = (fFam === 'all' || c.dataset.familia === fFam);
          var okP = (fProv === 'all' || c.dataset.provincia === fProv);
          var show = okF && okP;
          c.hidden = !show;
          if (show) visibles++;
        });
        if (none) none.hidden = visibles !== 0;
      }
      pills.forEach(function (b) {
        b.addEventListener('click', function () {
          pills.forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          fFam = b.dataset.familia;
          apply();
        });
      });
      if (prov) prov.addEventListener('change', function () { fProv = prov.value; apply(); });
    })();
    </script>
    <?php
    return ob_get_clean();
}

/* -------------------------------------------------------------------------
 * Estilos scoped (.ndx-*). Tier visual deliberadamente más liviano que las
 * fichas premium: grilla más densa, imagen más chica, borde fino, sin sombra
 * pesada. Comparte la paleta de NexoNegocios.
 * ---------------------------------------------------------------------- */

function ndx_styles(int $columnas): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    ?>
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    .ndx{--ndx-navy:#0b1c2e;--ndx-green:#2f8f38;--ndx-accent:#15314d;--ndx-ink:#1b2733;--ndx-muted:#69788a;--ndx-line:#e4e9ee;--ndx-soft:#f6f8fa;
      color:var(--ndx-ink);width:100%}
    /* Forzamos Montserrat en toda la sección para que el tema (Astra) no pise la fuente del título. */
    .ndx,.ndx *{box-sizing:border-box;font-family:'Montserrat',-apple-system,Segoe UI,Roboto,Arial,sans-serif!important}
    .ndx-wrap{width:min(1240px,calc(100% - 48px));margin:auto;padding:22px 0 8px}
    .ndx-head{padding:8px 0 22px;border-top:1px solid var(--ndx-line);margin-top:8px}
    .ndx-eye{margin:22px 0 6px;color:var(--ndx-green);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
    .ndx-title{margin:0;font-size:clamp(24px,3vw,34px);line-height:1.1;letter-spacing:-.02em;color:var(--ndx-navy)}
    .ndx-sub{margin:8px 0 0;color:var(--ndx-muted);font-size:15px}
    .ndx-filters{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:6px 0 22px}
    .ndx-pills{display:flex;flex-wrap:wrap;gap:8px}
    .ndx-pill{border:1px solid var(--ndx-line);border-radius:999px;padding:7px 13px;background:#fff;color:#42536a;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:.15s}
    .ndx-pill:hover{border-color:#c3ccd6}
    .ndx-pill.is-active{color:#fff;background:var(--ndx-navy);border-color:var(--ndx-navy)}
    .ndx-prov{margin-left:auto;border:1px solid var(--ndx-line);border-radius:8px;padding:8px 11px;background:#fff;font:inherit;font-size:12.5px;color:#42536a}
    .ndx-grid{display:grid;grid-template-columns:repeat(<?php echo (int) $columnas; ?>,minmax(0,1fr));gap:16px;padding-bottom:28px}
    .ndx-card{overflow:hidden;border:1px solid var(--ndx-line);border-radius:12px;background:#fff;transition:.18s}
    .ndx-card:hover{border-color:#cdd6df;box-shadow:0 8px 20px rgba(11,28,46,.07)}
    .ndx-card[hidden]{display:none!important}
    .ndx-link{display:flex;flex-direction:column;height:100%;color:inherit!important;text-decoration:none!important}
    .ndx-media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--ndx-soft)}
    .ndx-media img{width:100%;height:100%;object-fit:cover;display:block}
    .ndx-noimg{display:flex;height:100%;align-items:center;justify-content:center;font-size:34px;opacity:.5}
    .ndx-badge{position:absolute;left:10px;top:10px;padding:4px 9px;border-radius:999px;background:rgba(11,28,46,.9);color:#fff;font-size:10px;font-weight:800;letter-spacing:.04em}
    .ndx-body{display:flex;flex-direction:column;flex:1;padding:14px}
    .ndx-meta{margin:0 0 5px;color:var(--ndx-green);font-size:11px;font-weight:800;letter-spacing:.02em;text-transform:uppercase}
    .ndx-name{margin:0;font-size:16px;line-height:1.3;font-weight:700;color:var(--ndx-navy)}
    .ndx-hl{margin:8px 0 0;color:var(--ndx-muted);font-size:12.5px}
    .ndx-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:14px}
    .ndx-price{font-size:15px;font-weight:800;color:var(--ndx-ink)}
    .ndx-arrow{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ndx-soft);color:var(--ndx-navy);font-size:15px;font-weight:800}
    .ndx-empty,.ndx-noresults{margin:8px 0 28px;padding:34px;border:1px dashed var(--ndx-line);border-radius:12px;text-align:center;color:var(--ndx-muted);font-size:14px}
    @media(max-width:1080px){.ndx-grid{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:820px){.ndx-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:520px){.ndx-wrap{width:calc(100% - 24px)}.ndx-grid{grid-template-columns:1fr}.ndx-prov{margin-left:0;width:100%}}
    </style>
    <?php
}
