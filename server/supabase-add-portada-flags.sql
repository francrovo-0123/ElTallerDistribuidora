-- Flags para carruseles de Home: Destacados y En Oferta
-- Ejecutar en: Supabase → SQL Editor → New query → Run

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS es_destacado boolean NOT NULL DEFAULT false;

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS en_oferta boolean NOT NULL DEFAULT false;
