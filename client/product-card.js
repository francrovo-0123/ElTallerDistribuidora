/**
 * Tarjeta de producto estilo catálogo (imagen vertical + badge + COMPRAR).
 * Colores de botones: verde El Taller. Sin descuento por transferencia.
 */
(function (global) {
  function esc(v) {
    if (global.escapeHtml) return global.escapeHtml(v);
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function imgSrc(prod, fallback) {
    const raw = prod.img || prod.imagen || prod.imagen_url || '';
    if (global.safeUrl) return global.safeUrl(raw, fallback || 'https://via.placeholder.com/400x600');
    return raw || fallback || 'https://via.placeholder.com/400x600';
  }

  function formatPrecio(n) {
    return Number(n || 0).toLocaleString('es-AR');
  }

  /**
   * @param {object} prod
   * @param {object} [opts]
   * @param {'grid'|'carrusel'|'destacado'} [opts.variant]
   * @param {string} [opts.extraClass]
   * @param {string} [opts.addFn] nombre de función onclick (default: agregarAlCarrito)
   */
  function renderProductCard(prod, opts) {
    opts = opts || {};
    const variant = opts.variant || 'grid';
    const addFn = opts.addFn || 'agregarAlCarrito';
    const idNum = Number(prod.id);
    const idSafe = Number.isFinite(idNum) && idNum > 0 ? String(idNum) : '';
    const detalleHref = idSafe ? `producto.html?id=${idSafe}#id=${idSafe}` : 'producto.html';
    const nombre = esc(prod.titulo || prod.nombre || 'Producto');
    const precio = formatPrecio(prod.precio);
    const sinStock = Number(prod.stock) <= 0;
    const envioGratis = prod.envio_gratis !== false; // default true si no existe columna
    const esDestacado = !!prod.es_destacado || variant === 'destacado';
    const enOferta = !!prod.en_oferta || variant === 'oferta';
    const exclusivo = !!prod.exclusivo;

    const sizeClass =
      variant === 'destacado'
        ? 'et-product-card--destacado'
        : variant === 'carrusel' || variant === 'oferta'
          ? 'et-product-card--carrusel'
          : '';

    const badges = [];
    if (enOferta) {
      badges.push('<span class="et-product-card__badge et-product-card__badge--oferta" title="Oferta">Oferta</span>');
    } else if (esDestacado && variant !== 'grid') {
      badges.push('<span class="et-product-card__badge et-product-card__badge--destacado">Destacado</span>');
    }
    if (exclusivo) {
      badges.push('<span class="et-product-card__badge et-product-card__badge--exclusivo">Exclusivo</span>');
    }
    if (sinStock) {
      badges.push('<span class="et-product-card__badge et-product-card__badge--agotado">Agotado</span>');
    }

    return `
      <article class="et-product-card et-card ${sizeClass} ${esc(opts.extraClass || '')}">
        <a href="${detalleHref}" class="et-product-card__media" aria-label="${nombre}">
          <img class="et-img-fade" src="${esc(imgSrc(prod))}" alt="${nombre}" loading="lazy" width="400" height="600">
          ${envioGratis && !sinStock ? '<span class="et-product-card__envio">Envío gratis</span>' : ''}
          ${badges.length ? `<div class="et-product-card__badges">${badges.join('')}</div>` : ''}
        </a>
        <div class="et-product-card__body">
          <h3 class="et-product-card__title">
            <a href="${detalleHref}">${nombre}</a>
          </h3>
          <p class="et-product-card__price">$${precio}</p>
          <button
            type="button"
            class="et-product-card__btn et-btn et-press"
            onclick="${addFn}(${idNum})"
            ${sinStock ? 'disabled' : ''}
            aria-label="${sinStock ? 'Producto agotado' : 'Agregar al carrito'}">
            ${sinStock ? 'Agotado' : 'Comprar'}
          </button>
        </div>
      </article>
    `;
  }

  function renderProductSkeleton(opts) {
    opts = opts || {};
    const variant = opts.variant || 'grid';
    const extra =
      variant === 'destacado'
        ? 'et-skel-card--destacado carrusel-card'
        : variant === 'carrusel' || variant === 'oferta'
          ? 'et-skel-card--carrusel carrusel-card'
          : '';
    const i = Number(opts.index) || 0;
    return `
      <div class="et-skel-card ${extra}" style="--et-stagger:${Math.min(i, 12)}" aria-hidden="true">
        <span class="et-skel et-skel-card__media"></span>
        <span class="et-skel et-skel-card__line"></span>
        <span class="et-skel et-skel-card__line et-skel-card__line--sm"></span>
        <span class="et-skel et-skel-card__btn"></span>
      </div>`;
  }

  global.renderProductCard = renderProductCard;
  global.renderProductSkeleton = renderProductSkeleton;
  global.ElTallerProductCard = { render: renderProductCard, skeleton: renderProductSkeleton };
})(typeof window !== 'undefined' ? window : globalThis);
