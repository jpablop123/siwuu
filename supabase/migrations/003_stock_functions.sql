-- ============================================================
-- Función: decrementar_stock
-- Decrementa stock de un producto. Falla si no hay suficiente.
-- ============================================================
CREATE OR REPLACE FUNCTION decrementar_stock(
  p_producto_id UUID,
  p_cantidad     INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_actual INT;
BEGIN
  -- Lock de fila para evitar condición de carrera
  SELECT stock_virtual INTO v_stock_actual
  FROM productos
  WHERE id = p_producto_id
  FOR UPDATE;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_producto_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_stock_actual < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_stock_actual, p_cantidad
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE productos
  SET stock_virtual = stock_virtual - p_cantidad,
      updated_at = NOW()
  WHERE id = p_producto_id;
END;
$$;

-- ============================================================
-- Función: restaurar_stock
-- Revierte el stock de todos los items de un pedido.
-- Segura para llamar múltiples veces (idempotente).
-- ============================================================
CREATE OR REPLACE FUNCTION restaurar_stock(
  p_pedido_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE productos p
  SET stock_virtual = p.stock_virtual + pi.cantidad,
      updated_at = NOW()
  FROM pedido_items pi
  WHERE pi.pedido_id = p_pedido_id
    AND pi.producto_id = p.id;
END;
$$;

-- ============================================================
-- Función: generar_numero_pedido (si no existe ya)
-- ============================================================
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM pedidos;
  RETURN 'PED-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;
