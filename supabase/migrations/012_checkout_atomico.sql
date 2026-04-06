-- ============================================================
-- Migración 012 — Checkout transaccional atómico
--
-- Crea procesar_checkout_atomico(), que agrupa en una sola
-- transacción SQL los pasos que antes hacía pedidos.service.ts
-- en TypeScript con rollback manual:
--
--   1. INSERT en pedidos
--   2. decrementar_stock() por cada item   ← RAISE si sin stock
--   3. INSERT en pedido_items
--   4. INSERT en pagos
--
-- Si cualquier paso falla, PostgreSQL hace ROLLBACK automático.
-- El caller (pedidos.service.ts) ya no necesita lógica de
-- compensación; solo interpreta el error del RPC.
--
-- Parámetros:
--   p_pedido_id   — UUID pre-generado por TypeScript para poder
--                   calcular la referencia Wompi ANTES del RPC
--   p_items       — JSONB: [{producto_id, nombre_producto,
--                    imagen_producto, variante, cantidad,
--                    precio_unitario, subtotal}]
--   p_referencia  — Referencia Wompi (DRSHP-…) a registrar en pagos
--
-- Retorna TABLE(pedido_id UUID, token_acceso UUID) para que el
-- caller obtenga el token sin un SELECT extra.
-- ============================================================

CREATE OR REPLACE FUNCTION procesar_checkout_atomico(
  p_pedido_id    UUID,
  p_numero       TEXT,
  p_user_id      UUID,     -- NULL si el comprador es invitado
  p_email        TEXT,
  p_nombre       TEXT,
  p_telefono     TEXT,
  p_ciudad       TEXT,
  p_departamento TEXT,
  p_direccion    TEXT,
  p_subtotal     NUMERIC,
  p_costo_envio  NUMERIC,
  p_total        NUMERIC,
  p_items        JSONB,
  p_referencia   TEXT
)
RETURNS TABLE(pedido_id UUID, token_acceso UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token           UUID;
  v_item            JSONB;
  v_producto_id     UUID;
  v_cantidad        INT;
  v_nombre_producto TEXT;
  v_stock_actual    INT;
BEGIN
  -- ── 1. INSERT pedido ─────────────────────────────────────────────────
  -- token_acceso se genera automáticamente por DEFAULT gen_random_uuid()
  INSERT INTO pedidos (
    id, numero, user_id,
    email_cliente, nombre_cliente, telefono_cliente,
    ciudad, departamento, direccion_envio,
    subtotal, costo_envio, total, estado
  ) VALUES (
    p_pedido_id, p_numero, p_user_id,
    p_email, p_nombre, p_telefono,
    p_ciudad, p_departamento, p_direccion,
    p_subtotal, p_costo_envio, p_total, 'pendiente'
  )
  RETURNING pedidos.token_acceso INTO v_token;

  -- ── 2. Por cada item: validar stock + decrementar + INSERT ────────────
  --
  -- Se inlinea el check de stock (en lugar de delegar a decrementar_stock)
  -- para poder incluir el nombre exacto del producto en el mensaje de error.
  -- SELECT … FOR UPDATE adquiere el row-level lock en la misma query,
  -- garantizando la misma protección contra race conditions.
  -- Cualquier RAISE provoca el ROLLBACK automático de toda la transacción.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad    := (v_item->>'cantidad')::INT;

    -- Lock + nombre + stock en una sola query
    SELECT nombre, stock_virtual
      INTO v_nombre_producto, v_stock_actual
      FROM productos
     WHERE id = v_producto_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado: %', v_producto_id
        USING ERRCODE = 'P0002';
    END IF;

    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto: %', v_nombre_producto
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE productos
       SET stock_virtual = stock_virtual - v_cantidad,
           updated_at    = NOW()
     WHERE id = v_producto_id;

    INSERT INTO pedido_items (
      pedido_id, producto_id, nombre_producto, imagen_producto,
      variante, cantidad, precio_unitario, subtotal
    ) VALUES (
      p_pedido_id,
      v_producto_id,
      v_item->>'nombre_producto',
      v_item->>'imagen_producto',   -- puede ser NULL
      v_item->>'variante',          -- puede ser NULL
      v_cantidad,
      (v_item->>'precio_unitario')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC
    );
  END LOOP;

  -- ── 3. Registro de pago pendiente ────────────────────────────────────
  INSERT INTO pagos (pedido_id, monto, wompi_referencia, estado)
  VALUES (p_pedido_id, p_total, p_referencia, 'pendiente');

  -- ── 4. Devolver id y token para que el caller no necesite SELECT extra
  RETURN QUERY SELECT p_pedido_id, v_token;
END;
$$;

-- Revocar ejecución pública; solo el rol service_role puede llamarla
-- (el cliente anon/authenticated no tiene acceso directo)
REVOKE EXECUTE ON FUNCTION procesar_checkout_atomico(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;
