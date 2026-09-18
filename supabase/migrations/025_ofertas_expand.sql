-- ════════════════════════════════════════════════════════════════════════════
-- 025 · Marketplace, fase 1 de 3: EXPAND
--
-- Mueve el precio y el stock hacia una tabla `ofertas` (producto × vendedor)
-- SIN cambiar una línea de la interfaz y SIN tocar el camino del dinero.
--
-- Patrón expand → migrate → contract:
--
--   FASE 1 (esta)  `productos` sigue siendo la fuente de verdad. `ofertas`
--                  nace como espejo alimentado por trigger. El checkout, el
--                  cron y el admin siguen funcionando exactamente igual.
--   FASE 2         Se invierte: la UI y las RPC pasan a leer `ofertas`, y
--                  `productos` queda como espejo de lectura.
--   FASE 3         Se eliminan `productos.precio_venta` y `stock_virtual`.
--
-- Por qué así: `pedidos.service.ts` revalida el precio del carrito contra
-- `productos.precio_venta` y `procesar_checkout_atomico()` bloquea y descuenta
-- `productos.stock_virtual`. Ese es el camino del dinero y en esta fase no se
-- toca. Si algo sale mal acá, se borran las dos tablas nuevas y la tienda
-- sigue vendiendo.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Vendedores ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendedores (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT NOT NULL UNIQUE,
  nombre               TEXT NOT NULL,
  logo_url             TEXT,
  banner_url           TEXT,
  descripcion          TEXT,
  calificacion         NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_resenas        INTEGER NOT NULL DEFAULT 0,
  despacho_horas       INTEGER NOT NULL DEFAULT 24,
  politica_envio       TEXT,
  politica_devolucion  TEXT,
  estado               TEXT NOT NULL DEFAULT 'activo'
                       CHECK (estado IN ('activo', 'pausado', 'suspendido')),
  comision_pct         NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendedores IS
  'Vendedores del marketplace. Hoy solo existe Siwuu; los demás entran por el admin.';

-- El vendedor propio. Comisión 0: Siwuu no se cobra comisión a sí mismo.
INSERT INTO vendedores (slug, nombre, descripcion, despacho_horas, comision_pct)
VALUES (
  'siwuu',
  'Siwuu',
  'Tecnología original traída de Estados Unidos, con precio en pesos y todo incluido.',
  24,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Ofertas ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ofertas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id              UUID NOT NULL REFERENCES productos(id)  ON DELETE CASCADE,
  vendedor_id              UUID NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
  precio                   NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  precio_costo             NUMERIC(12,2),
  stock                    INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  origen                   TEXT NOT NULL DEFAULT 'importado'
                           CHECK (origen IN ('local', 'importado')),
  dias_min                 INTEGER NOT NULL DEFAULT 8,
  dias_max                 INTEGER NOT NULL DEFAULT 12,
  incluye_nacionalizacion  BOOLEAN NOT NULL DEFAULT TRUE,
  activa                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ofertas IS
  'Precio y stock de un producto para un vendedor. Fase 1: espejo de productos.';
COMMENT ON COLUMN ofertas.origen IS
  'local = ya está en Colombia; importado = se compra en USA cuando el cliente pide.';

-- Un vendedor no puede tener dos ofertas del mismo producto.
CREATE UNIQUE INDEX IF NOT EXISTS ofertas_producto_vendedor_uk
  ON ofertas (producto_id, vendedor_id);

-- El trigger de sincronización busca por producto_id en cada UPDATE de
-- productos: sin este índice, el cron diario de precios haría un seq scan por
-- cada fila.
CREATE INDEX IF NOT EXISTS ofertas_producto_idx ON ofertas (producto_id);
CREATE INDEX IF NOT EXISTS ofertas_vendedor_idx ON ofertas (vendedor_id) WHERE activa;

-- ── 3. Backfill: una oferta por producto ────────────────────────────────────

INSERT INTO ofertas (producto_id, vendedor_id, precio, precio_costo, stock, origen)
SELECT
  p.id,
  v.id,
  p.precio_venta,
  p.precio_costo,
  p.stock_virtual,
  'importado'
FROM productos p
CROSS JOIN (SELECT id FROM vendedores WHERE slug = 'siwuu') v
ON CONFLICT (producto_id, vendedor_id) DO NOTHING;

-- ── 4. Trazabilidad de la venta ─────────────────────────────────────────────
--
-- Sin esto, cuando entren más vendedores no habría forma de saber a quién
-- pagarle por una venta vieja: `pedido_items` solo apunta al producto.
-- Se llena solo (paso 5) para no tener que tocar la RPC del cobro.

ALTER TABLE pedido_items
  ADD COLUMN IF NOT EXISTS oferta_id UUID REFERENCES ofertas(id);

COMMENT ON COLUMN pedido_items.oferta_id IS
  'Qué oferta (y por lo tanto qué vendedor) se vendió. Lo llena un trigger.';

CREATE INDEX IF NOT EXISTS pedido_items_oferta_idx ON pedido_items (oferta_id);

-- Histórico: todas las ventas anteriores son del vendedor propio.
UPDATE pedido_items pi
   SET oferta_id = o.id
  FROM ofertas o
 WHERE o.producto_id = pi.producto_id
   AND pi.oferta_id IS NULL;

-- ── 5. El item de pedido resuelve su oferta solo ────────────────────────────
--
-- `procesar_checkout_atomico()` NO se modifica. Un BEFORE INSERT completa el
-- dato: así se gana la trazabilidad sin meter la mano en la función que crea
-- el pedido antes de mandarlo a Wompi.

CREATE OR REPLACE FUNCTION pedido_item_resolver_oferta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.oferta_id IS NULL AND NEW.producto_id IS NOT NULL THEN
    SELECT o.id
      INTO NEW.oferta_id
      FROM ofertas o
      JOIN vendedores v ON v.id = o.vendedor_id
     WHERE o.producto_id = NEW.producto_id
       AND o.activa
     ORDER BY (v.slug = 'siwuu') DESC, o.precio ASC
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pedido_item_oferta ON pedido_items;
CREATE TRIGGER trg_pedido_item_oferta
  BEFORE INSERT ON pedido_items
  FOR EACH ROW
  EXECUTE FUNCTION pedido_item_resolver_oferta();

-- ── 6. Sincronización productos → ofertas ───────────────────────────────────
--
-- Unidireccional a propósito. El admin, el cron de precios y el checkout
-- escriben en `productos`; hacerla bidireccional crearía ciclos de trigger y
-- carreras que no hacen falta mientras `productos` sea la fuente de verdad.
--
-- SECURITY DEFINER porque quien dispara el UPDATE cambia según el caso: el
-- cron (service_role), el admin (usuario autenticado) y el checkout (RPC
-- SECURITY DEFINER). Sin esto, RLS bloquearía la escritura en `ofertas`.

CREATE OR REPLACE FUNCTION sync_producto_a_oferta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendedor UUID;
BEGIN
  SELECT id INTO v_vendedor FROM vendedores WHERE slug = 'siwuu';
  IF v_vendedor IS NULL THEN
    RETURN NEW;   -- nunca debería pasar; no vale la pena tumbar la venta
  END IF;

  INSERT INTO ofertas (producto_id, vendedor_id, precio, precio_costo, stock)
  VALUES (NEW.id, v_vendedor, NEW.precio_venta, NEW.precio_costo, NEW.stock_virtual)
  ON CONFLICT (producto_id, vendedor_id) DO UPDATE
     SET precio       = EXCLUDED.precio,
         precio_costo = EXCLUDED.precio_costo,
         stock        = EXCLUDED.stock,
         updated_at   = NOW();

  RETURN NEW;
END;
$$;

-- Solo cuando cambia algo que a `ofertas` le importa: el cron diario hace un
-- UPDATE masivo y no tiene sentido disparar el trigger por cada campo.
DROP TRIGGER IF EXISTS trg_sync_producto_oferta ON productos;
CREATE TRIGGER trg_sync_producto_oferta
  AFTER UPDATE ON productos
  FOR EACH ROW
  WHEN (
    OLD.precio_venta   IS DISTINCT FROM NEW.precio_venta OR
    OLD.precio_costo   IS DISTINCT FROM NEW.precio_costo OR
    OLD.stock_virtual  IS DISTINCT FROM NEW.stock_virtual
  )
  EXECUTE FUNCTION sync_producto_a_oferta();

-- Un producto nuevo del admin nace con su oferta.
DROP TRIGGER IF EXISTS trg_sync_producto_oferta_insert ON productos;
CREATE TRIGGER trg_sync_producto_oferta_insert
  AFTER INSERT ON productos
  FOR EACH ROW
  EXECUTE FUNCTION sync_producto_a_oferta();

-- ── 7. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendedores activos son públicos" ON vendedores;
CREATE POLICY "vendedores activos son públicos"
  ON vendedores FOR SELECT
  USING (estado = 'activo');

DROP POLICY IF EXISTS "ofertas activas son públicas" ON ofertas;
CREATE POLICY "ofertas activas son públicas"
  ON ofertas FOR SELECT
  USING (activa);

-- La escritura queda solo para service_role (admin y crons), que salta RLS.
-- Cuando existan vendedores de verdad, acá entra la política por vendedor.

-- ── 8. Verificación ─────────────────────────────────────────────────────────
--
-- Debe devolver una sola fila con descuadres = 0 y sin ofertas faltantes.

SELECT
  (SELECT COUNT(*) FROM productos)                                   AS productos,
  (SELECT COUNT(*) FROM ofertas)                                     AS ofertas,
  (SELECT COUNT(*) FROM productos p
     WHERE NOT EXISTS (SELECT 1 FROM ofertas o WHERE o.producto_id = p.id))
                                                                     AS sin_oferta,
  (SELECT COUNT(*) FROM productos p
     JOIN ofertas o ON o.producto_id = p.id
    WHERE p.precio_venta IS DISTINCT FROM o.precio
       OR p.stock_virtual IS DISTINCT FROM o.stock)                  AS descuadres,
  (SELECT COUNT(*) FROM pedido_items WHERE oferta_id IS NULL)        AS items_sin_oferta;
