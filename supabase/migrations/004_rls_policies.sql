-- ============================================================
-- Helper: verificar si el usuario actual es admin
-- Usa security definer para evitar N+1 y recursión en RLS
-- ============================================================
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND rol = 'admin'
  );
$$;

-- ============================================================
-- Tabla: pedidos
-- ============================================================
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Clientes ven sus propios pedidos
CREATE POLICY "clientes_leen_sus_pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = user_id OR es_admin());

-- Clientes crean pedidos propios (o guest con user_id null via service role)
CREATE POLICY "clientes_crean_pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Solo admins actualizan pedidos (los clientes no pueden cambiar estado)
CREATE POLICY "admins_actualizan_pedidos"
  ON pedidos FOR UPDATE
  USING (es_admin());

-- Solo admins eliminan pedidos
CREATE POLICY "admins_eliminan_pedidos"
  ON pedidos FOR DELETE
  USING (es_admin());

-- ============================================================
-- Tabla: pedido_items
-- ============================================================
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Ver items de tus propios pedidos (join implícito via pedido)
CREATE POLICY "clientes_leen_sus_items"
  ON pedido_items FOR SELECT
  USING (
    es_admin() OR EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND p.user_id = auth.uid()
    )
  );

-- Insertar items solo a pedidos propios
CREATE POLICY "clientes_insertan_items"
  ON pedido_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- Solo admins modifican/eliminan items
CREATE POLICY "admins_modifican_items"
  ON pedido_items FOR UPDATE
  USING (es_admin());

CREATE POLICY "admins_eliminan_items"
  ON pedido_items FOR DELETE
  USING (es_admin());

-- ============================================================
-- Tabla: carrito_items
-- ============================================================
ALTER TABLE carrito_items ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven su propio carrito
CREATE POLICY "usuarios_leen_su_carrito"
  ON carrito_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios_insertan_en_su_carrito"
  ON carrito_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios_actualizan_su_carrito"
  ON carrito_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios_eliminan_de_su_carrito"
  ON carrito_items FOR DELETE
  USING (auth.uid() = user_id);
