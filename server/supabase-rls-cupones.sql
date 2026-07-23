-- DEPRECADO: usá server/supabase-rls-seguro.sql (este archivo dejaba USING true).\n\n-- Políticas RLS para la tabla "cupones"
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Sin esto, el checkout puede NO poder sumar usos_actuales.

ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de cupones" ON cupones;
DROP POLICY IF EXISTS "Permitir insertar cupones" ON cupones;
DROP POLICY IF EXISTS "Permitir actualizar cupones" ON cupones;
DROP POLICY IF EXISTS "Permitir eliminar cupones" ON cupones;

CREATE POLICY "Permitir lectura de cupones"
ON cupones FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir insertar cupones"
ON cupones FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir actualizar cupones"
ON cupones FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir eliminar cupones"
ON cupones FOR DELETE
TO anon, authenticated
USING (true);

-- Habilitar Realtime para que el admin actualice USOS solo
-- Supabase → Database → Replication → cupones → ON
-- O ejecutar:
-- ALTER PUBLICATION supabase_realtime ADD TABLE cupones;
