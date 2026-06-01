-- ============================================================
-- Migración 018 — Sistema de cupones de descuento
--
-- Permite al admin crear códigos (BLACKFRIDAY10, WELCOME15...)
-- que el cliente aplica en checkout. Soporta:
--   - Descuento por porcentaje (10%)  o  por monto fijo ($20.000)
--   - Mínimo de compra opcional
--   - Tope de usos totales opcional
--   - Fecha de expiración opcional
--   - Activación/desactivación manual
--
-- Atómico: la validación + incremento del contador + creación
-- del pedido pasan dentro de la misma transacción SQL
-- (procesar_checkout_atomico) — no hay forma de usar un cupón
-- agotado bajo concurrencia.
-- ============================================================


-- ── 1. Tabla cupones ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cupones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
  -- Para 'porcentaje': 0–100 (interpretado como %)
  -- Para 'fijo':       monto en COP
  valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  minimo_compra   NUMERIC(12,2),                       -- NULL = sin mínimo
  usos_maximos    INTEGER,                             -- NULL = ilimitado
  usos_actuales   INTEGER NOT NULL DEFAULT 0,
  expira_en       TIMESTAMPTZ,                         -- NULL = no expira
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Reglas adicionales: porcentaje no puede ser > 100
  CONSTRAINT porcentaje_max_100 CHECK (tipo <> 'porcentaje' OR valor <= 100),
  -- Contador no puede pasarse del tope
  CONSTRAINT usos_no_exceden_max CHECK (usos_maximos IS NULL OR usos_actuales <= usos_maximos)
);

CREATE INDEX idx_cupones_codigo_activo
  ON cupones (codigo)
  WHERE activo = TRUE;


-- ── 2. Columnas de descuento en pedidos ───────────────────────

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cupon_id     UUID REFERENCES cupones(id),
  ADD COLUMN IF NOT EXISTS codigo_cupon TEXT,
  ADD COLUMN IF NOT EXISTS descuento    NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN pedidos.cupon_id
  IS 'FK al cupón aplicado. NULL si el pedido no usó cupón.';
COMMENT ON COLUMN pedidos.codigo_cupon
  IS 'Código tal como se ingresó. Se snapshot-ea para que el código sobreviva si el cupón se borra.';
COMMENT ON COLUMN pedidos.descuento
  IS 'Monto descontado del subtotal. total = subtotal + costo_envio - descuento.';


-- ── 3. RLS para cupones ───────────────────────────────────────
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Solo admin puede gestionar. Las escrituras del checkout van
-- por service_role (bypass RLS), así que no se necesita policy
-- de INSERT/UPDATE para anon/authenticated.
DROP POLICY IF EXISTS "cupones_admin_all" ON cupones;
CREATE POLICY "cupones_admin_all"
  ON cupones FOR ALL
  USING (es_admin())
  WITH CHECK (es_admin());


-- ── 4. Función auxiliar de validación (read-only) ─────────────
--
-- Usada por /api/cupones/validar para mostrar preview del descuento
-- antes del checkout. NO modifica usos_actuales — eso lo hace
-- procesar_checkout_atomico de forma atómica con la creación.
--
-- Retorna NULL en `error` si el cupón es válido, o el motivo de
-- rechazo en español. Devolver descuento siempre, aunque inválido,
-- facilita el UI (puede mostrar "Te ahorrarías X — pero faltan Y
-- pesos para el mínimo").
CREATE OR REPLACE FUNCTION validar_cupon(
  p_codigo   TEXT,
  p_subtotal NUMERIC
)
RETURNS TABLE(
  cupon_id     UUID,
  codigo       TEXT,
  tipo         TEXT,
  valor        NUMERIC,
  descuento    NUMERIC,
  minimo_compra NUMERIC,
  error        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_cupon       cupones%ROWTYPE;
  v_descuento   NUMERIC := 0;
  v_error       TEXT := NULL;
BEGIN
  SELECT * INTO v_cupon FROM cupones
   WHERE upper(codigo) = upper(trim(p_codigo))
   LIMIT 1;

  IF NOT FOUND THEN
    -- Mensaje genérico — no revelar si el código existe
    RETURN QUERY SELECT NULL::UUID, p_codigo, NULL::TEXT, NULL::NUMERIC, 0::NUMERIC, NULL::NUMERIC,
                        'Código inválido'::TEXT;
    RETURN;
  END IF;

  IF NOT v_cupon.activo THEN
    v_error := 'Código inválido';
  ELSIF v_cupon.expira_en IS NOT NULL AND v_cupon.expira_en < NOW() THEN
    v_error := 'Este código expiró';
  ELSIF v_cupon.usos_maximos IS NOT NULL AND v_cupon.usos_actuales >= v_cupon.usos_maximos THEN
    v_error := 'Este código se agotó';
  ELSIF v_cupon.minimo_compra IS NOT NULL AND p_subtotal < v_cupon.minimo_compra THEN
    v_error := 'Compra mínima: $' || to_char(v_cupon.minimo_compra, 'FM999,999,999');
  END IF;

  -- Calcular descuento aunque haya error (UI puede usarlo como hint)
  IF v_cupon.tipo = 'porcentaje' THEN
    v_descuento := round(p_subtotal * v_cupon.valor / 100);
  ELSE
    v_descuento := least(v_cupon.valor, p_subtotal);  -- nunca > subtotal
  END IF;

  RETURN QUERY SELECT v_cupon.id, v_cupon.codigo, v_cupon.tipo, v_cupon.valor,
                      v_descuento, v_cupon.minimo_compra, v_error;
END;
$$;

REVOKE EXECUTE ON FUNCTION validar_cupon(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION validar_cupon(TEXT, NUMERIC) TO service_role;


-- ── 5. RPC procesar_checkout_atomico extendida ────────────────
--
-- Acepta opcionalmente un código de cupón. Si viene:
--   1. Valida con FOR UPDATE en la fila del cupón (lock pesimista)
--   2. Re-calcula descuento y total acá (no confía en input)
--   3. Incrementa usos_actuales
--   4. Persiste cupon_id, codigo_cupon, descuento en pedidos
--
-- Si la validación falla → RAISE EXCEPTION → ROLLBACK de TODO el pedido.
-- Si no viene código → comportamiento idéntico al de antes.

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
  p_total         NUMERIC,           -- ya no se usa; se recalcula con descuento
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
BEGIN
  -- ── 0. Validar + reservar cupón (si vino) ────────────────────
  IF p_codigo_cupon IS NOT NULL AND p_codigo_cupon <> '' THEN
    -- Lock pesimista: bloquea esta fila hasta que termine la TX.
    -- Otra request concurrente que intente el mismo código espera
    -- a que esta termine antes de leer usos_actuales.
    SELECT * INTO v_cupon FROM cupones
     WHERE upper(codigo) = upper(trim(p_codigo_cupon))
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Código de cupón inválido' USING ERRCODE = 'P0001';
    END IF;

    IF NOT v_cupon.activo THEN
      RAISE EXCEPTION 'Código de cupón inválido' USING ERRCODE = 'P0001';
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

    -- Recalcular descuento server-side
    IF v_cupon.tipo = 'porcentaje' THEN
      v_descuento := round(p_subtotal * v_cupon.valor / 100);
    ELSE
      v_descuento := least(v_cupon.valor, p_subtotal);
    END IF;

    -- Incrementar contador (la siguiente request verá usos_actuales+1)
    UPDATE cupones
       SET usos_actuales = usos_actuales + 1,
           updated_at    = NOW()
     WHERE id = v_cupon.id;
  END IF;

  v_total_final := p_subtotal + p_costo_envio - v_descuento;
  IF v_total_final < 0 THEN v_total_final := 0; END IF;

  -- ── 1. INSERT pedido (con descuento) ────────────────────────
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

  -- ── 2. Items + stock (lógica original sin cambios) ──────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad    := (v_item->>'cantidad')::INT;

    SELECT nombre, stock_virtual
      INTO v_nombre_producto, v_stock_actual
      FROM productos
     WHERE id = v_producto_id
       FOR UPDATE;

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

  -- ── 3. Pago (monto = total_final, no p_total) ───────────────
  INSERT INTO pagos (pedido_id, monto, wompi_referencia, estado)
  VALUES (p_pedido_id, v_total_final, p_referencia, 'pendiente');

  -- ── 4. Return ────────────────────────────────────────────────
  RETURN QUERY SELECT p_pedido_id, v_token, v_descuento, v_total_final;
END;
$$;

REVOKE EXECUTE ON FUNCTION procesar_checkout_atomico(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, JSONB, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
