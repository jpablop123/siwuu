-- ════════════════════════════════════════════════════════════════════════════
-- 024 · El precio de venta tiene que incluir el flete
--
-- Problema que corrige
-- --------------------
-- La fórmula de la migración 023 calculaba:
--
--     precio_venta = precio_usd × tasa × (1 + margen%)
--
-- es decir, aplicaba el margen SOLO sobre el costo del producto e ignoraba por
-- completo lo que cuesta traerlo. En un negocio de dropshipping desde Estados
-- Unidos el flete no es un detalle: en un accesorio liviano puede ser el 30%
-- del costo, y el margen se lo come entero.
--
-- Fórmula nueva
-- -------------
--     costo_total  = precio_usd + (peso_lb × tarifa_libra_usd)
--     precio_venta = costo_total × tasa × (1 + margen%)
--
-- La tarifa por libra del courier es "todo incluido": ya trae aduana e
-- impuestos, así que acá no se calculan por separado.
--
-- Ojo con el alto valor: varios couriers cambian la tarifa todo-incluido a
-- partir de cierto valor declarado. Si es tu caso, sube `tarifa_libra_usd`
-- o registra el sobrecosto en el peso equivalente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Peso de envío por producto ───────────────────────────────────────────

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS peso_lb NUMERIC(8,2) NOT NULL DEFAULT 1;

COMMENT ON COLUMN productos.peso_lb IS
  'Peso de envío en libras, con empaque. Alimenta el costo de flete dentro del precio de venta.';

-- ── 2. Tarifa del courier ───────────────────────────────────────────────────

ALTER TABLE config_trm
  ADD COLUMN IF NOT EXISTS tarifa_libra_usd NUMERIC(8,2) NOT NULL DEFAULT 5;

COMMENT ON COLUMN config_trm.tarifa_libra_usd IS
  'Lo que cobra el courier por libra desde Miami, todo incluido (flete + aduana + impuestos).';

-- ── 3. Recálculo con flete adentro ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalcular_precios()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasa   NUMERIC;
  v_margen NUMERIC;
  v_flete  NUMERIC;
  v_filas  INTEGER;
BEGIN
  SELECT (trm + trm_spread), margen_pct, tarifa_libra_usd
    INTO v_tasa, v_margen, v_flete
    FROM config_trm
   WHERE id IS TRUE;

  IF v_tasa IS NULL THEN
    RAISE EXCEPTION 'config_trm sin tasa configurada';
  END IF;

  UPDATE productos
     SET precio_costo = ROUND((precio_usd + peso_lb * v_flete) * v_tasa),
         precio_venta = ROUND((precio_usd + peso_lb * v_flete) * v_tasa * (1 + v_margen / 100.0))
   WHERE precio_usd IS NOT NULL;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  RETURN v_filas;
END;
$$;

COMMENT ON FUNCTION recalcular_precios() IS
  'Recalcula precio_costo y precio_venta incluyendo el flete. La dispara el cron diario de la TRM.';

-- ── 4. Los accesorios entran al sistema ─────────────────────────────────────
--
-- Doce productos se sembraron con los precios escritos a mano (costo × 4200)
-- y sin `precio_usd`, así que el cron nunca los tocaba: quedaron congelados con
-- una TRM vieja y un margen del 50%, mientras el resto del catálogo corría al
-- 15%. Acá se les deriva el precio en dólares desde el costo sembrado.

UPDATE productos
   SET precio_usd = ROUND((precio_costo / 4200.0)::NUMERIC, 2)
 WHERE precio_usd IS NULL
   AND precio_costo > 0;

-- ── 5. Pesos de envío estimados ─────────────────────────────────────────────
--
-- ESTIMADOS con empaque, para que el cálculo arranque. Ajústalos en el admin
-- con el peso real que te cobre el courier: de acá sale plata.

UPDATE productos SET peso_lb = 1.5  WHERE slug LIKE 'iphone%';
UPDATE productos SET peso_lb = 5.0  WHERE slug LIKE 'macbook-pro-14%' OR slug LIKE 'macbook-air%';
UPDATE productos SET peso_lb = 7.0  WHERE slug LIKE 'macbook-pro-16%';
UPDATE productos SET peso_lb = 16.0 WHERE slug LIKE 'imac%';
UPDATE productos SET peso_lb = 3.0  WHERE slug LIKE 'mac-mini%';
UPDATE productos SET peso_lb = 8.0  WHERE slug LIKE 'mac-studio%';
UPDATE productos SET peso_lb = 2.0  WHERE slug LIKE 'ipad%';
UPDATE productos SET peso_lb = 1.0  WHERE slug LIKE '%watch%' OR slug LIKE '%airpods%';
UPDATE productos SET peso_lb = 0.7  WHERE slug LIKE '%charger%' OR slug LIKE '%adapter%' OR slug LIKE '%power%';
UPDATE productos SET peso_lb = 0.4  WHERE slug LIKE '%cable%' OR slug LIKE '%earpods%';

-- ── 6. Aplicar ──────────────────────────────────────────────────────────────

SELECT recalcular_precios();
