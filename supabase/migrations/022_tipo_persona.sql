-- ============================================================
-- Migración 022 — Tipo de persona y documento en pedidos
--
-- Para emisión de factura electrónica DIAN necesitamos capturar:
--
--   Persona NATURAL (default):
--     - tipo_documento ∈ {'CC','CE','PA','TI'}
--     - numero_documento
--
--   Persona JURÍDICA (empresas):
--     - razón_social
--     - tipo_documento = 'NIT'
--     - numero_documento (NIT con o sin dígito de verificación)
--
-- Por defecto los pedidos legacy (antes de esta migración) son persona
-- natural, sin documento — quedan NULL y no se pueden facturar hasta
-- que el cliente complete el dato (flujo manual).
-- ============================================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo_persona     TEXT NOT NULL DEFAULT 'natural'
    CHECK (tipo_persona IN ('natural', 'juridica')),
  ADD COLUMN IF NOT EXISTS tipo_documento   TEXT
    CHECK (tipo_documento IS NULL OR tipo_documento IN ('CC', 'CE', 'PA', 'TI', 'NIT')),
  ADD COLUMN IF NOT EXISTS numero_documento TEXT,
  ADD COLUMN IF NOT EXISTS razon_social     TEXT;

-- Consistencia: si es jurídica, debe tener razón social y NIT.
-- Si es natural, no debería tener razón social.
ALTER TABLE pedidos
  ADD CONSTRAINT juridica_completa
  CHECK (
    tipo_persona = 'natural'
    OR (
      tipo_persona = 'juridica'
      AND razon_social   IS NOT NULL AND length(razon_social) > 0
      AND tipo_documento = 'NIT'
      AND numero_documento IS NOT NULL AND length(numero_documento) > 0
    )
  );

COMMENT ON COLUMN pedidos.tipo_persona
  IS 'natural | juridica — define qué campos de facturación se exigen.';
COMMENT ON COLUMN pedidos.tipo_documento
  IS 'CC | CE | PA | TI para natural; NIT para jurídica.';
COMMENT ON COLUMN pedidos.razon_social
  IS 'Nombre legal de la empresa (solo si tipo_persona = juridica).';


-- ── Actualizar procesar_checkout_atomico para aceptar los nuevos campos ──
-- Mantiene firma compatible con default null para no romper invocaciones
-- antiguas.

CREATE OR REPLACE FUNCTION procesar_checkout_atomico(
  p_pedido_id       UUID,
  p_numero          TEXT,
  p_user_id         UUID,
  p_email           TEXT,
  p_nombre          TEXT,
  p_telefono        TEXT,
  p_ciudad          TEXT,
  p_departamento    TEXT,
  p_direccion       TEXT,
  p_subtotal        NUMERIC,
  p_costo_envio     NUMERIC,
  p_total           NUMERIC,
  p_items           JSONB,
  p_referencia      TEXT,
  p_codigo_cupon    TEXT DEFAULT NULL,
  p_tipo_persona    TEXT DEFAULT 'natural',
  p_tipo_documento  TEXT DEFAULT NULL,
  p_numero_documento TEXT DEFAULT NULL,
  p_razon_social    TEXT DEFAULT NULL
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

    IF v_cupon.categoria_id IS NOT NULL THEN
      SELECT array_agg(DISTINCT pr.categoria_id)
        INTO v_categoria_ids
        FROM jsonb_array_elements(p_items) AS it
        JOIN productos pr ON pr.id = (it->>'producto_id')::UUID;

      IF EXISTS (SELECT 1 FROM unnest(v_categoria_ids) cid WHERE cid IS DISTINCT FROM v_cupon.categoria_id) THEN
        RAISE EXCEPTION 'Este cupón solo aplica a productos de una categoría específica' USING ERRCODE = 'P0001';
      END IF;
    END IF;

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
      IF v_ya_uso THEN RAISE EXCEPTION 'Ya usaste este cupón antes' USING ERRCODE = 'P0001'; END IF;
    END IF;

    IF v_cupon.solo_primera_compra THEN
      SELECT EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.estado IN ('pago_confirmado','procesando','enviado_proveedor','en_camino','entregado')
          AND (
            (p_user_id IS NOT NULL AND p.user_id = p_user_id) OR
            lower(p.email_cliente) = lower(p_email)
          )
      ) INTO v_tiene_paid;
      IF v_tiene_paid THEN RAISE EXCEPTION 'Este cupón es solo para tu primera compra' USING ERRCODE = 'P0001'; END IF;
    END IF;

    IF v_cupon.tipo = 'porcentaje' THEN
      v_descuento := round(p_subtotal * v_cupon.valor / 100);
    ELSE
      v_descuento := least(v_cupon.valor, p_subtotal);
    END IF;
    IF v_cupon.descuento_maximo IS NOT NULL AND v_descuento > v_cupon.descuento_maximo THEN
      v_descuento := v_cupon.descuento_maximo;
    END IF;

    UPDATE cupones SET usos_actuales = usos_actuales + 1, updated_at = NOW() WHERE id = v_cupon.id;
  END IF;

  v_total_final := p_subtotal + p_costo_envio - v_descuento;
  IF v_total_final < 0 THEN v_total_final := 0; END IF;

  -- ── 1. INSERT pedido (con nuevos campos de tipo persona) ──────
  INSERT INTO pedidos (
    id, numero, user_id,
    email_cliente, nombre_cliente, telefono_cliente,
    ciudad, departamento, direccion_envio,
    subtotal, costo_envio, descuento, total,
    cupon_id, codigo_cupon, estado,
    tipo_persona, tipo_documento, numero_documento, razon_social
  ) VALUES (
    p_pedido_id, p_numero, p_user_id,
    p_email, p_nombre, p_telefono,
    p_ciudad, p_departamento, p_direccion,
    p_subtotal, p_costo_envio, v_descuento, v_total_final,
    NULLIF(v_cupon.id, NULL), NULLIF(v_cupon.codigo, NULL), 'pendiente',
    COALESCE(p_tipo_persona, 'natural'),
    p_tipo_documento,
    p_numero_documento,
    p_razon_social
  )
  RETURNING pedidos.token_acceso INTO v_token;

  -- ── 2. Items + stock ──────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad    := (v_item->>'cantidad')::INT;

    SELECT nombre, stock_virtual INTO v_nombre_producto, v_stock_actual
      FROM productos WHERE id = v_producto_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado: %', v_producto_id USING ERRCODE = 'P0002';
    END IF;
    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto: %', v_nombre_producto USING ERRCODE = 'P0001';
    END IF;

    UPDATE productos SET stock_virtual = stock_virtual - v_cantidad, updated_at = NOW() WHERE id = v_producto_id;

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

  INSERT INTO pagos (pedido_id, monto, wompi_referencia, estado)
  VALUES (p_pedido_id, v_total_final, p_referencia, 'pendiente');

  RETURN QUERY SELECT p_pedido_id, v_token, v_descuento, v_total_final;
END;
$$;

REVOKE EXECUTE ON FUNCTION procesar_checkout_atomico(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
