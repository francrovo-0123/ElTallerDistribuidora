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

  function pulseClick(el) {
    if (!el) return;
    el.classList.remove('is-clicked');
    void el.offsetWidth;
    el.classList.add('is-clicked');
    el.addEventListener('animationend', () => el.classList.remove('is-clicked'), { once: true });
  }

  function crossfadeImage(img, newSrc) {
    if (!img || !newSrc) return;
    if (img.getAttribute('src') === newSrc) return;
    if (reduced) {
      img.src = newSrc;
      return;
    }
    img.classList.add('is-fading');
    const swap = () => {
      img.src = newSrc;
      raf(() => img.classList.remove('is-fading'));
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
    (root || document).querySelectorAll('.et-action-btn').forEach((btn) => {
      if (btn.dataset.etActionBound === '1') return;
      btn.dataset.etActionBound = '1';
      btn.addEventListener('click', () => pulseClick(btn));
    });
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
    crossfadeImage,
    bumpQty,
    flipReorder,
    captureRankTops,
    bindActionButtons,
    initPageEnter,
    bindAuthModal,
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
      api.initScrollReveal();
      api.bindActionButtons();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
