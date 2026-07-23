-- Badge "Envío gratis" en tarjetas de producto
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS envio_gratis boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.productos.envio_gratis IS
  'Si true, muestra el badge vertical Envío gratis en la tarjeta del catálogo';
