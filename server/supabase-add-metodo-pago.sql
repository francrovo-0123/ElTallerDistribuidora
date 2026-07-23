-- Agregar columna metodo_pago a pedidos (opcional pero recomendado)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Para el error de RLS en checkout, ejecutá también: supabase-rls-pedidos.sql

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS metodo_pago text;
