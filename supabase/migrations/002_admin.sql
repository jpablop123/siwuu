-- Agregar columnas faltantes a pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS numero_guia TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Bucket de imágenes para productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas del bucket
CREATE POLICY "Imágenes públicas lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos');

CREATE POLICY "Admin sube imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'productos' AND
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin elimina imágenes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'productos' AND
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin')
  );
