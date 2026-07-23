/**
 * El Taller — motion utilities (compositor-only: transform + opacity)
 * Zero dependencies. Respects prefers-reduced-motion.
 */
(function (global) {
  'use strict';

  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DUR_FAST = 180;
  const DUR = 280;
  const DUR_SLOW = 420;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function raf(fn) {
    return requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function enhanceCartDrawer() {
    const modal = document.getElementById('modal-carrito');
    if (!modal || modal.dataset.motionReady === '1') return modal;
    modal.dataset.motionReady = '1';
    modal.classList.add('et-drawer');
    const panel = modal.firstElementChild;
    if (panel) panel.classList.add('et-drawer-panel');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCartDrawer();
    });
    return modal;
  }

  function isCartOpen(modal) {
    return modal && modal.classList.contains('is-open');
  }

  function openCartDrawer() {
    const modal = enhanceCartDrawer();
    if (!modal || isCartOpen(modal)) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (reduced) {
      modal.classList.add('is-open');
      return;
    }
    raf(() => modal.classList.add('is-open'));
  }

  function closeCartDrawer() {
    const modal = enhanceCartDrawer();
    if (!modal || !isCartOpen(modal)) {
      if (modal) modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      return;
    }
    modal.classList.remove('is-open');
    document.body.classList.remove('overflow-hidden');
    if (reduced) {
      modal.classList.add('hidden');
      return;
    }
    const panel = modal.querySelector('.et-drawer-panel');
    const target = panel || modal;
    const onEnd = (e) => {
      if (e && e.target !== target && e.target !== modal) return;
      if (e && e.propertyName && e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
      modal.classList.add('hidden');
      target.removeEventListener('transitionend', onEnd);
    };
    target.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      if (!modal.classList.contains('is-open')) modal.classList.add('hidden');
    }, DUR_SLOW + 80);
  }

  function toggleCartDrawer() {
    const modal = enhanceCartDrawer();
    if (!modal) return;
    if (isCartOpen(modal) || (!modal.classList.contains('hidden') && modal.classList.contains('is-open'))) {
      closeCartDrawer();
    } else if (!modal.classList.contains('hidden') && !modal.classList.contains('is-open')) {
      // Was toggled with legacy hidden-only API mid-open
      openCartDrawer();
    } else {
      openCartDrawer();
    }
  }

  function popBadge(el) {
    if (!el || reduced) return;
    el.classList.remove('et-badge-pop');
    void el.offsetWidth;
    el.classList.add('et-badge-pop');
    const clear = () => el.classList.remove('et-badge-pop');
    el.addEventListener('animationend', clear, { once: true });
  }

  function updateCartBadge(count) {
    const els = document.querySelectorAll('#carrito-contador, .carrito-contador-badge, #cart-count');
    const n = Number(count) || 0;
    els.forEach((el) => {
      const prev = el.innerText;
      el.innerText = String(n);
      el.classList.toggle('hidden', n === 0);
      if (n > 0 && prev !== String(n)) popBadge(el);
    });
  }

  /**
   * Animate a numeric text node. Supports optional currency prefix "$".
   * @param {HTMLElement} el
   * @param {number} to
   * @param {{ prefix?: string, duration?: number, locale?: string }} [opts]
   */
  function animateNumber(el, to, opts) {
    if (!el) return;
    const options = opts || {};
    const prefix = options.prefix || '';
    const duration = options.duration || 700;
    const locale = options.locale || 'es-AR';
    const target = Number(to) || 0;

    if (reduced) {
      el.dataset.etValue = String(target);
      el.textContent = prefix + target.toLocaleString(locale);
      return;
    }

    const from = Number(el.dataset.etValue);
    const startVal = Number.isFinite(from) ? from : 0;
    el.dataset.etValue = String(target);

    if (startVal === target) {
      el.textContent = prefix + target.toLocaleString(locale);
      return;
    }

    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(startVal + (target - startVal) * eased);
      el.textContent = prefix + value.toLocaleString(locale);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function toast(message, type) {
    let host = document.getElementById('et-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'et-toast-host';
      host.className = 'et-toast-host';
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'et-toast' + (type === 'error' ? ' et-toast--error' : type === 'success' ? ' et-toast--success' : '');
    el.textContent = message;
    host.appendChild(el);
    raf(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), DUR);
    }, 2200);
  }

  function initScrollReveal(root) {
    if (reduced) {
      (root || document).querySelectorAll('[data-reveal]').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }
    const nodes = (root || document).querySelectorAll('[data-reveal]:not(.is-revealed)');
    if (!nodes.length || !('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    nodes.forEach((el) => io.observe(el));
  }

  function staggerChildren(container, itemSelector) {
    if (!container || reduced) return;
    const items = container.querySelectorAll(itemSelector || ':scope > *');
    items.forEach((el, i) => {
      el.classList.add('et-stagger-item');
      el.style.setProperty('--et-stagger', String(Math.min(i, 12)));
    });
    raf(() => container.classList.add('is-staggered'));
  }

  function flashState(el) {
    if (!el || reduced) return;
    el.classList.remove('et-state-flash');
    void el.offsetWidth;
    el.classList.add('et-state-flash');
    el.addEventListener('animationend', () => el.classList.remove('et-state-flash'), { once: true });
  }

  function pulseClick(el, event) {
    if (!el) return;
    el.classList.remove('is-clicked', 'is-ring');
    void el.offsetWidth;
    el.classList.add('is-clicked');
    if (!reduced && (el.classList.contains('et-btn') || el.classList.contains('et-btn-soft'))) {
      el.classList.add('is-ring');
    }
    spawnRipple(el, event);
    const clear = () => {
      el.classList.remove('is-clicked', 'is-ring');
    };
    el.addEventListener('animationend', clear, { once: true });
    setTimeout(clear, 420);
  }

  function spawnRipple(el, event) {
    if (!el || reduced) return;
    if (!el.classList.contains('et-btn') && !el.classList.contains('et-btn-icon') && !el.classList.contains('et-btn-soft') && !el.classList.contains('et-action-btn')) {
      return;
    }
    const rect = el.getBoundingClientRect();
    let x = rect.width / 2;
    let y = rect.height / 2;
    if (event && typeof event.clientX === 'number') {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    const ripple = document.createElement('span');
    ripple.className = 'et-ripple';
    ripple.style.setProperty('--et-rx', `${x}px`);
    ripple.style.setProperty('--et-ry', `${y}px`);
    el.appendChild(ripple);
    const remove = () => ripple.remove();
    ripple.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 600);
  }

  function crossfadeImage(img, newSrc) {
    if (!img || !newSrc) return;
    if (img.getAttribute('src') === newSrc) {
      img.classList.add('is-loaded');
      return;
    }
    if (reduced) {
      img.src = newSrc;
      img.classList.add('is-loaded');
      return;
    }
    img.classList.add('is-fading');
    img.classList.remove('is-loaded');
    const swap = () => {
      img.src = newSrc;
      const reveal = () => {
        img.classList.add('is-loaded');
        raf(() => img.classList.remove('is-fading'));
      };
      if (img.complete) reveal();
      else {
        img.addEventListener('load', reveal, { once: true });
        img.addEventListener('error', reveal, { once: true });
      }
    };
    const onEnd = (e) => {
      if (e.propertyName !== 'opacity') return;
      img.removeEventListener('transitionend', onEnd);
      swap();
    };
    img.addEventListener('transitionend', onEnd);
    setTimeout(swap, DUR_SLOW + 40);
  }

  function bumpQty(el) {
    if (!el || reduced) return;
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
    el.addEventListener('animationend', () => el.classList.remove('is-bump'), { once: true });
  }

  /**
   * FLIP reorder for ranking lists. Call after re-rendering children with data-rank-id.
   * @param {HTMLElement} container
   * @param {Map<string, number>} prevTops map id -> previous getBoundingClientRect().top
   */
  function flipReorder(container, prevTops) {
    if (!container || reduced || !prevTops) return;
    container.querySelectorAll('[data-rank-id]').forEach((el) => {
      const id = el.getAttribute('data-rank-id');
      const prevTop = prevTops.get(id);
      if (prevTop == null) {
        el.classList.add('et-row-enter');
        return;
      }
      const nextTop = el.getBoundingClientRect().top;
      const dy = prevTop - nextTop;
      if (Math.abs(dy) < 1) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      raf(() => {
        el.style.transition = '';
        el.style.transform = '';
      });
    });
  }

  function captureRankTops(container) {
    const map = new Map();
    if (!container) return map;
    container.querySelectorAll('[data-rank-id]').forEach((el) => {
      map.set(el.getAttribute('data-rank-id'), el.getBoundingClientRect().top);
    });
    return map;
  }

  function bindActionButtons(root) {
    (root || document).querySelectorAll('.et-action-btn, .et-btn, .et-btn-icon, .et-btn-soft').forEach((btn) => {
      if (btn.dataset.etActionBound === '1') return;
      btn.dataset.etActionBound = '1';
      btn.addEventListener('click', (e) => pulseClick(btn, e));
    });
  }

  const PRIMARY_BG_RE =
    /(?:^|\s)(?:bg-taller|bg-black|bg-slate-900|bg-red-600|bg-\[#3D5239\]|bg-\[#4A5D3F\]|bg-\[#25D366\]|bg-\[#1B4332\]|bg-\[#1ebe57\])(?:\s|$)/;
  const OUTLINE_RE = /(?:^|\s)border(?:\s|$|[-[])/;
  const ICON_SIZE_RE = /(?:^|\s)(?:w-6|w-8|w-9|w-11|w-12|w-14|h-6|h-8|h-9|h-11|h-12|h-14)(?:\s|$)/;

  function classifyControl(el) {
    if (!el || el.dataset.etEnhanced === '1') return null;
    if (el.classList.contains('banner-dot')) return null;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return null;

    const cls = el.className || '';
    if (typeof cls !== 'string') return null;

    // Already typed
    if (el.classList.contains('et-btn') || el.classList.contains('et-btn-icon') || el.classList.contains('et-btn-soft')) {
      return 'keep';
    }

    // Banner: tap frames only (no et-btn-icon — overflow/position)
    if (el.classList.contains('banner-btn')) return 'banner';

    if (el.classList.contains('et-product-card__btn')) return 'primary';
    if (el.classList.contains('carrusel-nav')) return 'icon';

    const isRound = /\brounded-full\b/.test(cls);
    const isCompactIcon =
      (ICON_SIZE_RE.test(cls) && (isRound || /\brounded-lg\b/.test(cls) || /\brounded\b/.test(cls)) && el.tagName === 'BUTTON') ||
      (isRound && ICON_SIZE_RE.test(cls));

    if (isCompactIcon) return 'icon';
    if (PRIMARY_BG_RE.test(cls) || /\bbg-taller\b/.test(cls)) return 'primary';
    if (OUTLINE_RE.test(cls) && (el.tagName === 'BUTTON' || el.tagName === 'A')) return 'soft';
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return 'press';
    return null;
  }

  function playEnterFrames(el, index) {
    if (!el || reduced || el.dataset.etEnterPlayed === '1') return;
    if (!el.classList.contains('et-btn') && !el.classList.contains('et-btn-icon') && !el.classList.contains('et-btn-soft')) {
      return;
    }
    el.dataset.etEnterPlayed = '1';
    el.classList.add('et-btn-enter');
    el.style.animationDelay = `${Math.min(index, 10) * 35}ms`;
    const clear = () => {
      el.classList.remove('et-btn-enter');
      el.style.animationDelay = '';
    };
    el.addEventListener('animationend', clear, { once: true });
    setTimeout(clear, 700);
  }

  function enhanceButtons(root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll(
      'button, [role="button"], a.et-btn, a.et-press, a.et-btn-icon, a.et-btn-soft, .banner-btn, a[class*="bg-taller"], a[class*="bg-[#3D5239]"], a[class*="bg-[#4A5D3F]"], a[class*="bg-black"], a[class*="bg-[#25D366]"], a[class*="bg-[#1B4332]"]'
    );

    let enterIndex = 0;
    nodes.forEach((el) => {
      if (el.dataset.etEnhanced === '1') {
        if (el.classList.contains('et-btn') || el.classList.contains('et-btn-icon') || el.classList.contains('et-btn-soft') || el.classList.contains('et-action-btn')) {
          if (el.dataset.etActionBound !== '1') {
            el.dataset.etActionBound = '1';
            el.addEventListener('click', (e) => pulseClick(el, e));
          }
        }
        return;
      }

      const kind = classifyControl(el);
      if (!kind) return;

      el.dataset.etEnhanced = '1';
      el.classList.add('et-press');

      if (kind === 'primary') {
        el.classList.add('et-btn');
      } else if (kind === 'icon') {
        el.classList.add('et-btn-icon');
      } else if (kind === 'soft') {
        el.classList.add('et-btn-soft');
      } else if (kind === 'banner') {
        if (el.dataset.etActionBound !== '1') {
          el.dataset.etActionBound = '1';
          el.addEventListener('click', (e) => pulseClick(el, e));
        }
        return;
      }

      if (el.classList.contains('et-btn') || el.classList.contains('et-btn-icon') || el.classList.contains('et-btn-soft') || el.classList.contains('et-action-btn')) {
        if (el.dataset.etActionBound !== '1') {
          el.dataset.etActionBound = '1';
          el.addEventListener('click', (e) => pulseClick(el, e));
        }
        playEnterFrames(el, enterIndex++);
      }
    });

    bindActionButtons(scope);
    bindImageFades(scope);
  }

  function bindImageFades(root) {
    const scope = root || document;
    const imgs = scope.querySelectorAll
      ? scope.querySelectorAll('img.et-img-fade')
      : scope.classList && scope.classList.contains('et-img-fade')
        ? [scope]
        : [];
    imgs.forEach((img) => {
      const mark = () => img.classList.add('is-loaded');
      if (img.complete && img.naturalWidth > 0) {
        mark();
        return;
      }
      if (img.dataset.etFadeBound === '1') return;
      img.dataset.etFadeBound = '1';
      img.addEventListener('load', mark, { once: true });
      img.addEventListener('error', mark, { once: true });
    });
  }

  /** Product-grid skeleton cards */
  function renderProductSkeletons(count, opts) {
    const n = Math.max(1, Math.min(Number(count) || 10, 20));
    const variant = (opts && opts.variant) || 'grid';
    const extra =
      variant === 'destacado'
        ? 'et-skel-card--destacado carrusel-card'
        : variant === 'carrusel' || variant === 'oferta'
          ? 'et-skel-card--carrusel carrusel-card'
          : '';
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `
        <div class="et-skel-card ${extra}" style="--et-stagger:${Math.min(i, 12)}" aria-hidden="true">
          <span class="et-skel et-skel-card__media"></span>
          <span class="et-skel et-skel-card__line"></span>
          <span class="et-skel et-skel-card__line et-skel-card__line--sm"></span>
          <span class="et-skel et-skel-card__btn"></span>
        </div>`;
    }
    return html;
  }

  function renderPdpSkeleton() {
    return `
      <div class="et-skel-pdp" aria-hidden="true">
        <span class="et-skel et-skel-pdp__media"></span>
        <div>
          <span class="et-skel et-skel-pdp__chip"></span>
          <span class="et-skel et-skel-pdp__title block"></span>
          <span class="et-skel et-skel-pdp__price block"></span>
          <span class="et-skel et-skel-pdp__text block"></span>
          <span class="et-skel et-skel-pdp__text block" style="width:92%"></span>
          <span class="et-skel et-skel-pdp__text block" style="width:70%"></span>
          <span class="et-skel et-skel-pdp__btn block"></span>
        </div>
      </div>`;
  }

  function renderCartSkeletons(count) {
    const n = Math.max(1, Math.min(Number(count) || 3, 6));
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `
        <div class="et-skel-row" style="--et-stagger:${i}" aria-hidden="true">
          <span class="et-skel et-skel-row__thumb"></span>
          <div class="et-skel-row__body">
            <span class="et-skel et-skel-row__line block"></span>
            <span class="et-skel et-skel-row__line et-skel-row__line--sm block"></span>
          </div>
        </div>`;
    }
    return html;
  }

  function showSkeletons(container, html) {
    if (!container) return;
    container.innerHTML = html;
    container.setAttribute('aria-busy', 'true');
  }

  function clearBusy(container) {
    if (container) container.removeAttribute('aria-busy');
  }

  /** Auto data-reveal on static content pages */
  function autoMarkReveals() {
    const main = document.querySelector('main');
    if (!main || main.dataset.etRevealAuto === '1') return;
    if (
      document.getElementById('grid-productos') ||
      document.getElementById('grilla-productos') ||
      document.getElementById('detalle-producto-container') ||
      document.body.classList.contains('admin-body') ||
      document.getElementById('admin-app')
    ) {
      return;
    }
    const candidates = main.querySelectorAll(
      ':scope > section, :scope > .max-w-3xl > div, :scope > .max-w-3xl > section, :scope > div.space-y-10 > div, :scope > .max-w-4xl > section, :scope > .max-w-2xl > *'
    );
    candidates.forEach((el, i) => {
      if (el.hasAttribute('data-reveal')) return;
      if (el.querySelector('[data-reveal]')) return;
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = `${Math.min(i, 8) * 55}ms`;
    });
    main.dataset.etRevealAuto = '1';
  }

  function observeButtonEnhancements() {
    if (typeof MutationObserver === 'undefined' || document.body.dataset.etBtnObserver === '1') return;
    document.body.dataset.etBtnObserver = '1';
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      raf(() => {
        scheduled = false;
        enhanceButtons(document);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function initPageEnter() {
    if (reduced) {
      document.documentElement.classList.add('et-ready');
      return;
    }
    document.documentElement.classList.add('et-page-enter');
    raf(() => document.documentElement.classList.add('et-ready'));
    // Safety: never leave the page invisible if rAF is delayed
    setTimeout(() => document.documentElement.classList.add('et-ready'), 600);
  }

  function bindAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal || modal.dataset.motionReady === '1') return;
    modal.dataset.motionReady = '1';
    modal.classList.add('et-modal');
    const panel = modal.querySelector('.transform') || modal.firstElementChild;
    if (panel) panel.classList.add('et-modal-panel');
  }

  const api = {
    EASE,
    DUR_FAST,
    DUR,
    DUR_SLOW,
    reduced,
    enhanceCartDrawer,
    openCartDrawer,
    closeCartDrawer,
    toggleCartDrawer,
    popBadge,
    updateCartBadge,
    animateNumber,
    toast,
    initScrollReveal,
    staggerChildren,
    flashState,
    pulseClick,
    spawnRipple,
    crossfadeImage,
    bumpQty,
    flipReorder,
    captureRankTops,
    bindActionButtons,
    enhanceButtons,
    observeButtonEnhancements,
    initPageEnter,
    bindAuthModal,
    bindImageFades,
    renderProductSkeletons,
    renderPdpSkeleton,
    renderCartSkeletons,
    showSkeletons,
    clearBusy,
    autoMarkReveals,
  };

  global.ElTallerMotion = api;

  // Public aliases used by pages
  global.toggleCarrito = function toggleCarritoMotion() {
    api.toggleCartDrawer();
  };

  if (typeof document !== 'undefined') {
    const boot = () => {
      api.enhanceCartDrawer();
      api.bindAuthModal();
      api.initPageEnter();
      api.autoMarkReveals();
      api.initScrollReveal();
      api.enhanceButtons();
      api.bindActionButtons();
      api.bindImageFades();
      api.observeButtonEnhancements();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
