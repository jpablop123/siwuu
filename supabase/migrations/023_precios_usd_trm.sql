-- ============================================================
-- Migración 023 — Precios basados en USD + TRM automática
--
-- Modelo de negocio (personal shopper desde USA):
--   precio_usd   = precio del producto en dólares (fuente de verdad)
--   tasa         = TRM oficial + spread fijo "por la compra"
--   precio_venta = precio_usd × (trm + spread) × (1 + margen%)
--
-- La TRM se refresca a diario con un cron (/api/cron/update-trm) que
-- consulta datos.gov.co y luego llama a recalcular_precios().
--
-- Autosuficiente: no depende de tienda_configuracion (que puede no existir
-- en esta base). Crea su propia tabla config_trm. Idempotente.
-- Cómo correrlo: pegar todo en el SQL Editor de Supabase y darle Run.
-- ============================================================

-- ── 1. precio_usd como fuente de verdad ──────────────────────────
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_usd NUMERIC(12,2);

COMMENT ON COLUMN productos.precio_usd IS
  'Precio del producto en USD. Si está seteado, precio_venta se recalcula desde la TRM.';

-- ── 2. Tabla singleton de configuración de TRM ───────────────────
CREATE TABLE IF NOT EXISTS config_trm (
  id             BOOLEAN       PRIMARY KEY DEFAULT TRUE,
  CONSTRAINT config_trm_singleton CHECK (id = TRUE),
  trm            NUMERIC(12,2) NOT NULL DEFAULT 3427.07,  -- TRM oficial
  trm_spread     NUMERIC(12,2) NOT NULL DEFAULT 100,      -- "+100 por la compra"
  margen_pct     NUMERIC(6,2)  NOT NULL DEFAULT 15,       -- margen personal shopper
  trm_updated_at TIMESTAMPTZ
);

INSERT INTO config_trm (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Solo el service_role (cron) la lee/escribe. La función la usa vía
-- SECURITY DEFINER, así que no hace falta política pública.
ALTER TABLE config_trm ENABLE ROW LEVEL SECURITY;

-- ── 3. Recalcular precios desde la TRM ───────────────────────────
-- Solo toca productos con precio_usd seteado (los accesorios con precio
-- COP fijo quedan intactos). Devuelve cuántas filas actualizó.
CREATE OR REPLACE FUNCTION recalcular_precios()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasa NUMERIC;
  v_margen NUMERIC;
  v_n INTEGER;
BEGIN
  SELECT (trm + trm_spread), margen_pct
    INTO v_tasa, v_margen
    FROM config_trm
   WHERE id = TRUE;

  UPDATE productos
     SET precio_costo   = ROUND(precio_usd * v_tasa),
         precio_venta   = ROUND(precio_usd * v_tasa * (1 + v_margen / 100.0)),
         precio_tachado = ROUND(precio_usd * v_tasa * (1 + v_margen / 100.0) * 1.2),
         updated_at     = NOW()
   WHERE precio_usd IS NOT NULL;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
