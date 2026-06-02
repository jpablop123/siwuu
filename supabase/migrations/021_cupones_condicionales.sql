-- ============================================================
-- Migración 021 — Cupones con condicionales avanzadas
--
-- Suma 5 nuevas restricciones sobre cuándo un cupón es aplicable:
--
--   1. solo_primera_compra   — cliente sin ningún pedido pagado previo
--   2. categoria_id          — cupón válido solo si TODOS los items pertenecen
--                              a esa categoría
--   3. un_uso_por_cliente    — cada email (o user_id si está logueado) puede
--                              usar este cupón solo una vez
--   4. inicia_en             — el cupón empieza a ser válido a partir de X fecha
--   5. descuento_maximo      — cap absoluto al monto descontado
--                              (útil para % grandes: "20% pero hasta $50.000")
--
-- Las funciones validar_cupon y procesar_checkout_atomico se reescriben
-- para chequear estas condiciones de forma atómica.
-- ============================================================


-- ── 1. Columnas nuevas en cupones ─────────────────────────────

ALTER TABLE cupones
  ADD COLUMN IF NOT EXISTS solo_primera_compra BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS categoria_id        UUID                 REFERENCES categorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS un_uso_por_cliente  BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inicia_en           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS descuento_maximo    NUMERIC(12,2);

-- Validaciones de sanidad
ALTER TABLE cupones
  ADD CONSTRAINT descuento_maximo_positivo
  CHECK (descuento_maximo IS NULL OR descuento_maximo > 0);


-- ── 2. validar_cupon extendida ────────────────────────────────
--
-- Acepta opcionalmente:
--   - p_email      → para verificar "primera compra" y "un uso por cliente"
--                    de clientes guest (sin user_id)
--   - p_user_id    → para verificar "un uso por cliente" de clientes logueados
--   - p_categoria_ids → set de categorías de los items del carrito,
--                       para verificar la restricción de categoría

CREATE OR REPLACE FUNCTION validar_cupon(
  p_codigo         TEXT,
  p_subtotal       NUMERIC,
  p_email          TEXT  DEFAULT NULL,
  p_user_id        UUID  DEFAULT NULL,
  p_categoria_ids  UUID[] DEFAULT NULL
)
RETURNS TABLE(
  cupon_id      UUID,
  codigo        TEXT,
  tipo          TEXT,
  valor         NUMERIC,
  descuento     NUMERIC,
  minimo_compra NUMERIC,
  error         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_cupon       cupones%ROWTYPE;
  v_descuento   NUMERIC := 0;
  v_error       TEXT := NULL;
  v_ya_uso      BOOLEAN := FALSE;
  v_tiene_paid  BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_cupon FROM cupones
   WHERE upper(codigo) = upper(trim(p_codigo))
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, p_codigo, NULL::TEXT, NULL::NUMERIC,
                        0::NUMERIC, NULL::NUMERIC, 'Código inválido'::TEXT;
    RETURN;
  END IF;

  -- Reglas básicas (existentes)
  IF NOT v_cupon.activo THEN
    v_error := 'Código inválido';
  ELSIF v_cupon.inicia_en IS NOT NULL AND v_cupon.inicia_en > NOW() THEN
    v_error := 'Este código aún no está activo';
  ELSIF v_cupon.expira_en IS NOT NULL AND v_cupon.expira_en < NOW() THEN
    v_error := 'Este código expiró';
  ELSIF v_cupon.usos_maximos IS NOT NULL AND v_cupon.usos_actuales >= v_cupon.usos_maximos THEN
    v_error := 'Este código se agotó';
  ELSIF v_cupon.minimo_compra IS NOT NULL AND p_subtotal < v_cupon.minimo_compra THEN
    v_error := 'Compra mínima: $' || to_char(v_cupon.minimo_compra, 'FM999,999,999');

  -- Restricción de categoría: todos los items deben ser de la categoría del cupón
  ELSIF v_cupon.categoria_id IS NOT NULL AND p_categoria_ids IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(p_categoria_ids) cid
      WHERE cid IS DISTINCT FROM v_cupon.categoria_id
    ) THEN
      v_error := 'Este cupón solo aplica a productos de una categoría específica';
    END IF;
  END IF;

  -- Si pasó las anteriores, validar las condiciones que dependen del cliente
  IF v_error IS NULL THEN
    -- Un uso por cliente
    IF v_cupon.un_uso_por_cliente THEN
      SELECT EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.cupon_id = v_cupon.id
          AND p.estado <> 'cancelado'
          AND (
            (p_user_id IS NOT NULL AND p.user_id = p_user_id) OR
            (p_email IS NOT NULL AND lower(p.email_cliente) = lower(p_email))
          )
      ) INTO v_ya_uso;

      IF v_ya_uso THEN
        v_error := 'Ya usaste este cupón antes';
      END IF;
    END IF;

    -- Solo primera compra: que NO tenga pedidos pagados
    IF v_error IS NULL AND v_cupon.solo_primera_compra THEN
      SELECT EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.estado IN ('pago_confirmado','procesando','enviado_proveedor','en_camino','entregado')
          AND (
            (p_user_id IS NOT NULL AND p.user_id = p_user_id) OR
            (p_email IS NOT NULL AND lower(p.email_cliente) = lower(p_email))
          )
      ) INTO v_tiene_paid;

      IF v_tiene_paid THEN
        v_error := 'Este cupón es solo para tu primera compra';
      END IF;
    END IF;
  END IF;

  -- Calcular descuento aplicando cap si corresponde
  IF v_cupon.tipo = 'porcentaje' THEN
    v_descuento := round(p_subtotal * v_cupon.valor / 100);
  ELSE
    v_descuento := least(v_cupon.valor, p_subtotal);
  END IF;
  IF v_cupon.descuento_maximo IS NOT NULL AND v_descuento > v_cupon.descuento_maximo THEN
    v_descuento := v_cupon.descuento_maximo;
  END IF;

  RETURN QUERY SELECT v_cupon.id, v_cupon.codigo, v_cupon.tipo, v_cupon.valor,
                      v_descuento, v_cupon.minimo_compra, v_error;
END;
$$;

REVOKE EXECUTE ON FUNCTION validar_cupon(TEXT, NUMERIC, TEXT, UUID, UUID[]) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION validar_cupon(TEXT, NUMERIC, TEXT, UUID, UUID[]) TO service_role;


-- ── 3. procesar_checkout_atomico — validación atómica de las nuevas condiciones
--
-- Re-implementación completa de la función de la migración 018 con
-- los chequeos extra antes del INSERT del pedido.

CREATE OR REPLACE FUNCTION procesar_checkout_atomico(
  p_pedido_id     UUID,
  p_numero        TEXT,
  p_user_id       UUID,
  p_email         TEXT,
  p_nombre        TEXT,
  p_telefono      TEXT,
  p_ciudad        TEXT,
  p_departamento  TEXT,
  p_direccion     TEXT,
  p_subtotal      NUMERIC,
  p_costo_envio   NUMERIC,
  p_total         NUMERIC,
  p_items         JSONB,
  p_referencia    TEXT,
  p_codigo_cupon  TEXT DEFAULT NULL
)
RETURNS TABLE(
  pedido_id     UUID,
  token_acceso  UUID,
  descuento     NUMERIC,
  total_final   NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token            UUID;
  v_item             JSONB;
  v_producto_id      UUID;
  v_cantidad         INT;
  v_nombre_producto  TEXT;
  v_stock_actual     INT;
  v_cupon            cupones%ROWTYPE;
  v_descuento        NUMERIC := 0;
  v_total_final      NUMERIC;
  v_categoria_ids    UUID[];
  v_ya_uso           BOOLEAN;
  v_tiene_paid       BOOLEAN;
BEGIN
  -- ── 0. Cupón ──────────────────────────────────────────────────
  IF p_codigo_cupon IS NOT NULL AND p_codigo_cupon <> '' THEN
    SELECT * INTO v_cupon FROM cupones
     WHERE upper(codigo) = upper(trim(p_codigo_cupon))
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Código de cupón inválido' USING ERRCODE = 'P0001';
    END IF;

    IF NOT v_cupon.activo THEN
      RAISE EXCEPTION 'Código de cupón inválido' USING ERRCODE = 'P0001';
    END IF;
    IF v_cupon.inicia_en IS NOT NULL AND v_cupon.inicia_en > NOW() THEN
      RAISE EXCEPTION 'El cupón aún no está activo' USING ERRCODE = 'P0001';
    END IF;
    IF v_cupon.expira_en IS NOT NULL AND v_cupon.expira_en < NOW() THEN
      RAISE EXCEPTION 'El cupón expiró' USING ERRCODE = 'P0001';
    END IF;
    IF v_cupon.usos_maximos IS NOT NULL AND v_cupon.usos_actuales >= v_cupon.usos_maximos THEN
      RAISE EXCEPTION 'El cupón se agotó' USING ERRCODE = 'P0001';
    END IF;
    IF v_cupon.minimo_compra IS NOT NULL AND p_subtotal < v_cupon.minimo_compra THEN
      RAISE EXCEPTION 'Compra mínima no alcanzada para este cupón' USING ERRCODE = 'P0001';
    END IF;

    -- Categoría: extraer categoria_ids de los productos del pedido
    IF v_cupon.categoria_id IS NOT NULL THEN
      SELECT array_agg(DISTINCT pr.categoria_id)
        INTO v_categoria_ids
        FROM jsonb_array_elements(p_items) AS it
        JOIN productos pr ON pr.id = (it->>'producto_id')::UUID;

      IF EXISTS (
        SELECT 1 FROM unnest(v_categoria_ids) cid
        WHERE cid IS DISTINCT FROM v_cupon.categoria_id
      ) THEN
        RAISE EXCEPTION 'Este cupón solo aplica a productos de una categoría específica' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Un uso por cliente
    IF v_cupon.un_uso_por_cliente THEN
      SELECT EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.cupon_id = v_cupon.id
          AND p.estado <> 'cancelado'
          AND (
            (p_user_id IS NOT NULL AND p.user_id = p_user_id) OR
            lower(p.email_cliente) = lower(p_email)
          )
      ) INTO v_ya_uso;

      IF v_ya_uso THEN
        RAISE EXCEPTION 'Ya usaste este cupón antes' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Solo primera compra
    IF v_cupon.solo_primera_compra THEN
      SELECT EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.estado IN ('pago_confirmado','procesando','enviado_proveedor','en_camino','entregado')
          AND (
            (p_user_id IS NOT NULL AND p.user_id = p_user_id) OR
            lower(p.email_cliente) = lower(p_email)
          )
      ) INTO v_tiene_paid;

      IF v_tiene_paid THEN
        RAISE EXCEPTION 'Este cupón es solo para tu primera compra' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Calcular descuento + cap
    IF v_cupon.tipo = 'porcentaje' THEN
      v_descuento := round(p_subtotal * v_cupon.valor / 100);
    ELSE
      v_descuento := least(v_cupon.valor, p_subtotal);
    END IF;
    IF v_cupon.descuento_maximo IS NOT NULL AND v_descuento > v_cupon.descuento_maximo THEN
      v_descuento := v_cupon.descuento_maximo;
    END IF;

    -- Incrementar contador
    UPDATE cupones
       SET usos_actuales = usos_actuales + 1,
           updated_at    = NOW()
     WHERE id = v_cupon.id;
  END IF;

  v_total_final := p_subtotal + p_costo_envio - v_descuento;
  IF v_total_final < 0 THEN v_total_final := 0; END IF;

  -- ── 1. INSERT pedido ──────────────────────────────────────────
  INSERT INTO pedidos (
    id, numero, user_id,
    email_cliente, nombre_cliente, telefono_cliente,
    ciudad, departamento, direccion_envio,
    subtotal, costo_envio, descuento, total,
    cupon_id, codigo_cupon, estado
  ) VALUES (
    p_pedido_id, p_numero, p_user_id,
    p_email, p_nombre, p_telefono,
    p_ciudad, p_departamento, p_direccion,
    p_subtotal, p_costo_envio, v_descuento, v_total_final,
    NULLIF(v_cupon.id, NULL), NULLIF(v_cupon.codigo, NULL), 'pendiente'
  )
  RETURNING pedidos.token_acceso INTO v_token;

  -- ── 2. Items + stock ──────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad    := (v_item->>'cantidad')::INT;

    SELECT nombre, stock_virtual
      INTO v_nombre_producto, v_stock_actual
      FROM productos WHERE id = v_producto_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado: %', v_producto_id USING ERRCODE = 'P0002';
    END IF;
    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto: %', v_nombre_producto USING ERRCODE = 'P0001';
    END IF;

    UPDATE productos
       SET stock_virtual = stock_virtual - v_cantidad,
           updated_at    = NOW()
     WHERE id = v_producto_id;

    INSERT INTO pedido_items (
      pedido_id, producto_id, nombre_producto, imagen_producto,
      variante, cantidad, precio_unitario, subtotal
    ) VALUES (
      p_pedido_id, v_producto_id,
      v_item->>'nombre_producto',
      v_item->>'imagen_producto',
      v_item->>'variante',
      v_cantidad,
      (v_item->>'precio_unitario')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC
    );
  END LOOP;

  -- ── 3. Pago pendiente ──────────────────────────────────────────
  INSERT INTO pagos (pedido_id, monto, wompi_referencia, estado)
  VALUES (p_pedido_id, v_total_final, p_referencia, 'pendiente');

  RETURN QUERY SELECT p_pedido_id, v_token, v_descuento, v_total_final;
END;
$$;

REVOKE EXECUTE ON FUNCTION procesar_checkout_atomico(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, JSONB, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;


-- ── Verificación manual ────────────────────────────────────────
-- SELECT codigo, solo_primera_compra, un_uso_por_cliente, descuento_maximo
-- FROM cupones;
