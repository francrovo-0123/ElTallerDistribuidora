-- DEPRECADO: usá server/supabase-rls-seguro.sql (este archivo dejaba USING true).\n\n-- Políticas RLS para la tabla "productos"
-- Ejecutar en: Supabase → SQL Editor → New query → Run

-- Asegurar que RLS esté activo
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Quitar políticas viejas si existen (para poder re-ejecutar este script)
DROP POLICY IF EXISTS "Permitir lectura de productos" ON productos;
DROP POLICY IF EXISTS "Permitir insertar productos" ON productos;
DROP POLICY IF EXISTS "Permitir actualizar productos" ON productos;
DROP POLICY IF EXISTS "Permitir eliminar productos" ON productos;

-- Lectura pública (tienda + panel admin)
CREATE POLICY "Permitir lectura de productos"
ON productos FOR SELECT
TO anon, authenticated
USING (true);

-- Crear productos desde el panel admin
CREATE POLICY "Permitir insertar productos"
ON productos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Editar stock / precio (admin y descuento al comprar)
CREATE POLICY "Permitir actualizar productos"
ON productos FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Eliminar productos desde el panel admin
CREATE POLICY "Permitir eliminar productos"
ON productos FOR DELETE
TO anon, authenticated
USING (true);
