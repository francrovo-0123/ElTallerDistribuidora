-- =============================================================================
-- DEPRECADO: NO ejecutar este archivo en producción.
-- Usá en este orden:
--   1) server/supabase-rls-seguro.sql
--   2) server/supabase-checkout-seguro.sql
--   3) server/supabase-security-hardening.sql
--
-- Este script histórico otorgaba EXECUTE de descontar_stock a anon y confiaba
-- en el total enviado por el cliente. Abajo solo queda el CHECK de stock >= 0
-- y la REVOCACIÓN de grants peligrosos (seguro de re-ejecutar).
-- =============================================================================

UPDATE public.productos SET stock = 0 WHERE stock < 0;

ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS productos_stock_non_negative;

ALTER TABLE public.productos
  ADD CONSTRAINT productos_stock_non_negative CHECK (stock >= 0);

-- Por si alguien corrió una versión vieja de este archivo:
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM anon, authenticated;

-- La lógica real de pedido+stock+precios está en supabase-checkout-seguro.sql
-- y supabase-security-hardening.sql (crear_pedido_con_stock / preview_pedido).
