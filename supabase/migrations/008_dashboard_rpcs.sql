-- ============================================================
-- Migración 008 — RPCs del Dashboard Admin
--
-- 1. ventas_por_dia_30  → serie de 30 días con ventas diarias
--                         (incluye días sin ventas con total = 0)
-- 2. top_productos_5    → top 5 productos por ingresos acumulados
--
-- Los estados "válidos" (que generan ingreso real) son los mismos
-- que usa obtenerMetricasDashboard() en src/lib/actions/admin.ts.
-- ============================================================

-- Estados que cuentan como ingreso real
-- pendiente → NO (puede expirar sin pago)
-- cancelado → NO
-- los demás  → SÍ

-- ============================================================
-- 1. ventas_por_dia_30
-- ============================================================

CREATE OR REPLACE FUNCTION ventas_por_dia_30()
RETURNS TABLE(fecha TEXT, total NUMERIC)
LANGUAGE sql
SECURITY DEFINER
STABLE                   -- misma tx = mismo resultado; permite plan caching
AS $$
  SELECT
    gs.dia::TEXT                    AS fecha,
    COALESCE(SUM(p.total), 0)       AS total
  FROM generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS gs(dia)
  LEFT JOIN pedidos p
    ON  p.created_at::DATE = gs.dia
    AND p.estado IN (
      'pago_confirmado',
      'procesando',
      'enviado_proveedor',
      'en_camino',
      'entregado'
    )
  GROUP BY gs.dia
  ORDER BY gs.dia;
$$;


-- ============================================================
-- 2. top_productos_5
-- ============================================================

CREATE OR REPLACE FUNCTION top_productos_5()
RETURNS TABLE(nombre TEXT, unidades BIGINT, ingresos NUMERIC)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    pi.nombre_producto                       AS nombre,
    COALESCE(SUM(pi.cantidad), 0)            AS unidades,
    COALESCE(SUM(pi.subtotal), 0)            AS ingresos
  FROM pedido_items pi
  JOIN pedidos p ON p.id = pi.pedido_id
  WHERE p.estado IN (
    'pago_confirmado',
    'procesando',
    'enviado_proveedor',
    'en_camino',
    'entregado'
  )
  GROUP BY pi.nombre_producto
  ORDER BY ingresos DESC
  LIMIT 5;
$$;


-- ============================================================
-- Permisos: solo el rol service_role puede ejecutarlas
-- (ya garantizado por SECURITY DEFINER, pero explicitamos)
-- ============================================================

REVOKE EXECUTE ON FUNCTION ventas_por_dia_30() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION ventas_por_dia_30() TO service_role;

REVOKE EXECUTE ON FUNCTION top_productos_5()   FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION top_productos_5()   TO service_role;


-- ============================================================
-- Verificación post-migración
-- ============================================================
-- SELECT * FROM ventas_por_dia_30() LIMIT 5;
-- SELECT * FROM top_productos_5();
