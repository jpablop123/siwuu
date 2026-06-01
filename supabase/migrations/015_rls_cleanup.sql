-- ============================================================
-- Migración 015 — Limpieza y consolidación de RLS
--
-- Problema:
--   La migración 001 creó políticas `admin_full_*` con la forma:
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
--   Cuando estas se evalúan sobre la propia tabla `profiles` (o cualquier
--   tabla con RLS), Postgres entra en recursión: para verificar el rol
--   hace SELECT sobre profiles, que dispara la misma policy, que vuelve
--   a hacer SELECT, etc. → `infinite recursion detected in policy`.
--
--   La migración 004 introdujo `es_admin()` con SECURITY DEFINER (corre
--   con permisos del owner, salta RLS), pero solo reemplazó las policies
--   de `pedidos`, `pedido_items` y `carrito_items`. Las viejas de 001
--   nunca se borraron y conviven con las nuevas.
--
-- Esta migración:
--   1. Borra todas las policies recursivas de 001.
--   2. Las recrea usando `es_admin()`.
--   3. Activa RLS en las tablas catalog (productos, categorias, etc.)
--      que en 001 tenían policies pero RLS quedó OFF (las policies
--      no se aplican si RLS está deshabilitado).
-- ============================================================

-- ============================================================
-- 1. Drop policies recursivas viejas (idempotente con IF EXISTS)
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "admin_full_profiles"   ON profiles;
DROP POLICY IF EXISTS "usuario_ve_su_perfil"  ON profiles;
DROP POLICY IF EXISTS "usuario_edita_su_perfil" ON profiles;

-- direcciones
DROP POLICY IF EXISTS "admin_full_direcciones"      ON direcciones;
DROP POLICY IF EXISTS "usuario_gestiona_direcciones" ON direcciones;

-- pagos
DROP POLICY IF EXISTS "admin_full_pagos"      ON pagos;
DROP POLICY IF EXISTS "usuario_ve_sus_pagos"  ON pagos;

-- productos
DROP POLICY IF EXISTS "admin_full_productos"          ON productos;
DROP POLICY IF EXISTS "productos_lectura_publica"     ON productos;

-- categorias
DROP POLICY IF EXISTS "admin_full_categorias"         ON categorias;
DROP POLICY IF EXISTS "categorias_lectura_publica"    ON categorias;

-- variantes
DROP POLICY IF EXISTS "admin_full_variantes" ON variantes;

-- proveedores
DROP POLICY IF EXISTS "admin_full_proveedores" ON proveedores;


-- ============================================================
-- 2. Asegurar RLS habilitado en todas las tablas (era opcional en 001)
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. Profiles — sin recursión (no se referencia a sí misma)
-- ============================================================

CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR es_admin());

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR es_admin());

CREATE POLICY "profiles_admin_full"
  ON profiles FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());


-- ============================================================
-- 4. Direcciones — usuario gestiona las propias, admin todo
-- ============================================================

CREATE POLICY "direcciones_owner_all"
  ON direcciones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "direcciones_admin_all"
  ON direcciones FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());


-- ============================================================
-- 5. Pagos — cliente ve sus pagos, admin gestiona todo
-- ============================================================

CREATE POLICY "pagos_owner_select"
  ON pagos FOR SELECT
  USING (
    es_admin() OR EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "pagos_admin_full"
  ON pagos FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());


-- ============================================================
-- 6. Catálogo público — lectura abierta, escritura solo admin
-- ============================================================

CREATE POLICY "productos_public_select"
  ON productos FOR SELECT
  USING (activo = TRUE OR es_admin());

CREATE POLICY "productos_admin_write"
  ON productos FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "categorias_public_select"
  ON categorias FOR SELECT
  USING (activa = TRUE OR es_admin());

CREATE POLICY "categorias_admin_write"
  ON categorias FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "variantes_public_select"
  ON variantes FOR SELECT
  USING (TRUE);  -- las variantes filtradas vienen joineadas con productos

CREATE POLICY "variantes_admin_write"
  ON variantes FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "proveedores_admin_only"
  ON proveedores FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());


-- ============================================================
-- Verificación post-migración (ejecutar manualmente)
-- ============================================================
-- Listar todas las policies que mencionan profiles en USING/WITH CHECK:
--   SELECT tablename, policyname, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
--
-- Ninguna debe contener `EXISTS (SELECT 1 FROM profiles WHERE ...)`.
-- Solo `es_admin()` debe aparecer como helper.
