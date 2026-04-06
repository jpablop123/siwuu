-- ============================================================
-- Migración 011 — Sincronización del rol al JWT (app_metadata)
--
-- Problema: el middleware hace un query a profiles en CADA request
-- a /admin/* para verificar el rol. A escala eso es un N+1 query
-- por request.
--
-- Solución: trigger AFTER INSERT OR UPDATE OF rol ON profiles que
-- escribe raw_app_meta_data.rol en auth.users. El middleware lee
-- user.app_metadata.rol directo del objeto devuelto por getUser()
-- (que ya hace 1 llamada al server de auth) sin query adicional.
--
-- Backfill: actualiza todos los usuarios existentes en este deploy.
-- ============================================================

-- ── 1. Función trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_rol_a_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('rol', NEW.rol)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ── 2. Trigger ────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_profile_rol_change ON public.profiles;

CREATE TRIGGER on_profile_rol_change
  AFTER INSERT OR UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_rol_a_jwt();

-- ── 3. Backfill usuarios existentes ──────────────────────────────────
-- Propaga el rol actual de cada profile a auth.users.raw_app_meta_data
-- para que el middleware funcione desde el primer deploy.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, rol FROM public.profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('rol', r.rol)
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- ============================================================
-- Verificación post-migración
-- ============================================================
-- SELECT au.id, p.rol, au.raw_app_meta_data->>'rol' AS jwt_rol
-- FROM public.profiles p JOIN auth.users au ON au.id = p.id
-- WHERE p.rol = 'admin'
-- LIMIT 5;
