-- ============================================================
-- Migración 014 — CMS de contenido de la tienda
--
-- Crea dos tablas para que el admin gestione la apariencia
-- de la homepage sin tocar código:
--
--   tienda_banners       — slides del hero carousel (N filas)
--   tienda_configuracion — singleton para el promo banner
--
-- RLS:
--   SELECT: público (el homepage usa el cliente anon)
--   INSERT / UPDATE / DELETE: solo admins (vía es_admin() de migración 004)
--   En la práctica las escrituras van por service role (admin.ts), así
--   que las políticas de escritura son un segundo cinturón de seguridad.
-- ============================================================


-- ── 1. tienda_banners ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tienda_banners (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo                TEXT        NOT NULL,
  subtitulo             TEXT,
  tag                   TEXT,                                          -- ej. "Nueva colección"
  imagen_url            TEXT        NOT NULL,
  cta_label             TEXT        NOT NULL DEFAULT 'Ver catálogo',
  cta_href              TEXT        NOT NULL DEFAULT '/productos',
  cta_secundario_label  TEXT,
  cta_secundario_href   TEXT,
  align                 TEXT        NOT NULL DEFAULT 'left'
                          CHECK (align IN ('left', 'center')),
  activo                BOOLEAN     NOT NULL DEFAULT TRUE,
  orden                 INT         NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tienda_banners ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer (homepage con cliente anon)
DROP POLICY IF EXISTS "banners_select_publico" ON tienda_banners;
CREATE POLICY "banners_select_publico"
  ON tienda_banners FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "admins_insert_banners" ON tienda_banners;
CREATE POLICY "admins_insert_banners"
  ON tienda_banners FOR INSERT
  WITH CHECK (es_admin());

DROP POLICY IF EXISTS "admins_update_banners" ON tienda_banners;
CREATE POLICY "admins_update_banners"
  ON tienda_banners FOR UPDATE
  USING (es_admin());

DROP POLICY IF EXISTS "admins_delete_banners" ON tienda_banners;
CREATE POLICY "admins_delete_banners"
  ON tienda_banners FOR DELETE
  USING (es_admin());


-- ── 2. tienda_configuracion (singleton) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tienda_configuracion (
  id                BOOLEAN     PRIMARY KEY DEFAULT TRUE,
  CONSTRAINT enforce_singleton CHECK (id = TRUE),

  -- Promo banner
  promo_tag         TEXT        NOT NULL DEFAULT 'Colección exclusiva',
  promo_titulo      TEXT        NOT NULL DEFAULT 'Audio que cambia todo',
  promo_descripcion TEXT                 DEFAULT 'Auriculares con cancelación de ruido activa, 30 h de autonomía y sonido que no encontrarás en otro lado.',
  promo_descuento   TEXT        NOT NULL DEFAULT '20% OFF',
  promo_cta_label   TEXT        NOT NULL DEFAULT 'Comprar ahora',
  promo_cta_href    TEXT        NOT NULL DEFAULT '/productos',
  promo_imagen      TEXT,                                              -- URL del bucket

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tienda_configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_select_publico" ON tienda_configuracion;
CREATE POLICY "config_select_publico"
  ON tienda_configuracion FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "admins_insert_config" ON tienda_configuracion;
CREATE POLICY "admins_insert_config"
  ON tienda_configuracion FOR INSERT
  WITH CHECK (es_admin());

DROP POLICY IF EXISTS "admins_update_config" ON tienda_configuracion;
CREATE POLICY "admins_update_config"
  ON tienda_configuracion FOR UPDATE
  USING (es_admin());

-- Insertar fila inicial del singleton (idempotente)
INSERT INTO tienda_configuracion DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;
