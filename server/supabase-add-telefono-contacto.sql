-- Agregar columna teléfono a mensajes de contacto
-- Ejecutar en Supabase → SQL Editor si ya corriste supabase-rls-seguro.sql antes

ALTER TABLE public.mensajes_contacto
  ADD COLUMN IF NOT EXISTS telefono text;
