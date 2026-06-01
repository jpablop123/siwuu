-- ============================================================
-- Migración 017 — Trazabilidad de consentimiento (Ley 1581 / Habeas Data)
--
-- Para e-commerce colombiano la SIC puede exigir prueba de que el
-- usuario consintió explícitamente al tratamiento de datos personales.
-- Sin estas columnas, en una denuncia no podés demostrar:
--   - cuándo aceptó los términos y condiciones
--   - cuándo aceptó la política de tratamiento de datos
--   - desde qué IP se hizo el consentimiento
--
-- Las tres columnas son `nullable` porque las cuentas creadas antes
-- de esta migración no tienen el consentimiento registrado retroactivo.
-- En el formulario nuevo de registro son required.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepted_tos_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_ip           INET;

-- Comentarios para documentar la intención en la DB
COMMENT ON COLUMN profiles.accepted_tos_at
  IS 'Timestamp del check explícito de "Acepto Términos y Condiciones" al registrarse. NULL = cuenta legacy.';
COMMENT ON COLUMN profiles.accepted_privacy_at
  IS 'Timestamp del check explícito de "Acepto Política de Tratamiento de Datos Personales" (Ley 1581).';
COMMENT ON COLUMN profiles.consent_ip
  IS 'IP del cliente al momento del consentimiento. Evidencia ante la SIC.';

-- Índice opcional para auditorías masivas — útil si en algún momento
-- necesitás listar cuentas sin consentimiento registrado.
CREATE INDEX IF NOT EXISTS idx_profiles_sin_consent
  ON profiles (id)
  WHERE accepted_tos_at IS NULL OR accepted_privacy_at IS NULL;
