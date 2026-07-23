-- Agregar código de seguimiento de correo a pedidos
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS codigo_seguimiento text;
