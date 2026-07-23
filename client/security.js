/**
 * Utilidades de seguridad compartidas (XSS / URLs / texto).
 * Cargar ANTES de scripts que rendericen datos de DB o localStorage.
 */
(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  /** Solo http(s), rutas relativas o data:image — bloquea javascript: etc. */
  function safeUrl(value, fallback) {
    const fb = fallback == null ? '' : String(fallback);
    const raw = String(value || '').trim();
    if (!raw) return fb;
    const lower = raw.toLowerCase();
    if (
      lower.startsWith('https://') ||
      lower.startsWith('http://') ||
      lower.startsWith('/') ||
      lower.startsWith('./') ||
      lower.startsWith('data:image/')
    ) {
      if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return fb;
      return raw.replace(/"/g, '%22');
    }
    // Ruta relativa tipo "eltaller.png" o storage path sin scheme
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      return raw.replace(/"/g, '%22').replace(/</g, '');
    }
    return fb;
  }

  function truncate(value, max) {
    const s = String(value ?? '');
    const n = Number(max) || 0;
    if (n < 1 || s.length <= n) return s;
    return s.slice(0, n);
  }

  function isValidEmail(value) {
    const s = String(value || '').trim();
    if (s.length < 5 || s.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  global.ElTallerSecurity = {
    escapeHtml,
    escapeAttr,
    safeUrl,
    truncate,
    isValidEmail
  };

  // Atajos globales usados por páginas existentes
  global.escapeHtml = escapeHtml;
  global.escapeAttr = escapeAttr;
  global.safeUrl = safeUrl;
})(typeof window !== 'undefined' ? window : globalThis);
