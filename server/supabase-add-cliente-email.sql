-- Agregar columna cliente_email a pedidos
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Necesaria para vincular pedidos al usuario logueado y mostrar "Mis pedidos"

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cliente_email text;

-- Índice para consultas por email en Mi cuenta
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email
ON pedidos (cliente_email);
