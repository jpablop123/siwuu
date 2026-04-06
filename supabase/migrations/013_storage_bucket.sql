-- ============================================================
-- Migración 013 — Bucket de imágenes de productos
--
-- Crea el bucket público "productos_imagenes" en Supabase Storage
-- con políticas RLS:
--   - Lectura pública (cualquier visitante puede ver las imágenes)
--   - Inserción solo para admins (via app_metadata.rol sincronizado
--     por el trigger de la migración 011 — sin join a profiles)
--   - Borrado solo para admins
--
-- NOTA: Requiere que RLS esté habilitado en storage.objects.
-- En Supabase está habilitado por defecto.
-- ============================================================


-- ── 1. Crear bucket público ───────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos_imagenes',
  'productos_imagenes',
  true,
  5242880,                                         -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ── 2. Políticas RLS ─────────────────────────────────────────────────────
--
-- Lectura pública — cualquier cliente puede descargar imágenes
--

DROP POLICY IF EXISTS "productos_imagenes_public_read" ON storage.objects;
CREATE POLICY "productos_imagenes_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'productos_imagenes');


-- Subida solo para admins autenticados
-- Usa app_metadata.rol para evitar un JOIN a profiles en cada upload.
-- El campo se mantiene sincronizado con el trigger on_profile_rol_change.

DROP POLICY IF EXISTS "productos_imagenes_admin_insert" ON storage.objects;
CREATE POLICY "productos_imagenes_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'productos_imagenes'
  AND auth.role() = 'authenticated'
  AND (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
);


-- Borrado solo para admins

DROP POLICY IF EXISTS "productos_imagenes_admin_delete" ON storage.objects;
CREATE POLICY "productos_imagenes_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'productos_imagenes'
  AND auth.role() = 'authenticated'
  AND (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
);
