-- Bucket de imágenes de productos
-- 1) En Supabase → Storage → New bucket
--    Name: productos-img
--    Public bucket: YES
--
-- 2) Ejecutá estas políticas en SQL Editor (ajustá si ya existen)

-- Lectura pública de imágenes
DROP POLICY IF EXISTS "Lectura publica productos-img" ON storage.objects;
CREATE POLICY "Lectura publica productos-img"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos-img');

-- Subida desde el panel admin (usuarios autenticados)
DROP POLICY IF EXISTS "Subida autenticada productos-img" ON storage.objects;
CREATE POLICY "Subida autenticada productos-img"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos-img');

-- Actualizar / reemplazar (opcional)
DROP POLICY IF EXISTS "Update autenticada productos-img" ON storage.objects;
CREATE POLICY "Update autenticada productos-img"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos-img')
WITH CHECK (bucket_id = 'productos-img');
