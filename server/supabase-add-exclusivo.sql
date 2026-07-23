-- Agregar columna "exclusivo" a la tabla productos
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS exclusivo boolean NOT NULL DEFAULT false;
