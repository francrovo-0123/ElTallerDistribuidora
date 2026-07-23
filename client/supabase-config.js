/**
 * Configuración pública de Supabase (anon / publishable key).
 * NUNCA pegues aquí la service_role key.
 *
 * La anon key es intencionalmente pública (RLS es la defensa real).
 * Cambiá URL/key/admin en UN solo lugar.
 */
(function (global) {
  'use strict';

  const config = {
    url: 'https://fmtgtznlidnhoxkffvmh.supabase.co',
    anonKey: 'sb_publishable_UVhp7iJZfZCoe_ZQEnZYxA_KgftIVu2',
    adminEmail: 'eltalleradmin@gmail.com'
  };

  global.ELTALLER_SUPABASE = config;

  global.esEmailAdmin = function esEmailAdmin(email) {
    if (!email) return false;
    return String(email).trim().toLowerCase() === config.adminEmail.toLowerCase();
  };
})(typeof window !== 'undefined' ? window : globalThis);
