-- ============================================================
-- Migración 023 — País de residencia en profiles
--
-- Agrega columna `pais` (ISO 3166-1 alpha-2) al perfil del usuario.
-- Capturada en el registro vía el dropdown "País" que controla también
-- el código del teléfono (+57, +58, +52, ...).
--
-- Utilidad:
--   - Marketing: segmentar campañas por país de residencia
--   - Envíos: pre-llenar datos de checkout futuros
--   - Analytics: distribución geográfica de clientes
--
-- Default NULL para compatibilidad con cuentas previas.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pais TEXT
    CHECK (pais IS NULL OR pais ~ '^[A-Z]{2}$');

COMMENT ON COLUMN profiles.pais
  IS 'ISO 3166-1 alpha-2 del país de residencia del usuario. NULL para cuentas legacy.';
