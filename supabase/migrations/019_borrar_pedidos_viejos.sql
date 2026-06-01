-- ============================================================
-- Migración 019 — Borrado de pedidos viejos sin pago
--
-- Complementa al cron de expiración (007 + 016).
--
--   • expirar_pedidos_pendientes  → corre cada 5 min, CANCELA pedidos
--                                    sin pagar (libera stock).
--   • borrar_pedidos_antiguos_sin_pago → corre 1 vez al día,
--                                    BORRA pedidos viejos cancelados/pendientes
--                                    que nunca tuvieron pago aprobado.
--
-- Filtros defensivos:
--   1. Solo estado IN ('pendiente', 'cancelado') — nunca toca paid.
--   2. created_at < NOW() − INTERVAL '10 days'.
--   3. No tiene NINGÚN pago aprobado asociado (doble seguridad).
--
-- Beneficios:
--   • DB más liviana (índices más rápidos, backups más livianos).
--   • Compliance con Habeas Data: no retenemos PII de clientes que nunca
--     compraron más de lo necesario.
--   • Sin impacto en DIAN: factura electrónica solo aplica a paid.
--
-- Cascadas:
--   • pedido_items → ON DELETE CASCADE (definido en 001) → se borran solos.
--   • pagos        → no tiene CASCADE; los borramos explícitamente antes.
-- ============================================================

CREATE OR REPLACE FUNCTION borrar_pedidos_antiguos_sin_pago()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ids   UUID[];
  v_count INTEGER := 0;
BEGIN
  -- ── 1. Recolectar IDs candidatos ─────────────────────────────
  --
  -- LEFT JOIN + filtro `pa.id IS NULL` para encontrar pedidos sin
  -- pago aprobado. Es más rápido que `NOT IN (SELECT…)` y maneja
  -- correctamente el caso de pedidos sin filas en pagos.
  SELECT array_agg(p.id) INTO v_ids
  FROM   pedidos p
  LEFT JOIN pagos pa
    ON pa.pedido_id = p.id
   AND pa.estado    = 'aprobado'
  WHERE  p.estado IN ('pendiente', 'cancelado')
    AND  p.created_at < NOW() - INTERVAL '10 days'
    AND  pa.id IS NULL;

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RETURN 0;
  END IF;

  -- ── 2. Borrar dependencias sin CASCADE ──────────────────────
  -- pagos no tiene ON DELETE CASCADE, así que va primero.
  DELETE FROM pagos WHERE pedido_id = ANY(v_ids);

  -- ── 3. Borrar pedidos (pedido_items cascadea) ───────────────
  DELETE FROM pedidos WHERE id = ANY(v_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;


-- ============================================================
-- Cron: corre 1 vez al día a las 3 AM Colombia (8 AM UTC).
-- Es horario de baja carga; un DELETE masivo no afecta el sitio.
-- ============================================================

DO $$
BEGIN
  -- Eliminar job previo si existe (idempotente en re-runs)
  BEGIN
    PERFORM cron.unschedule('borrar-pedidos-sin-pago');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM cron.schedule(
    'borrar-pedidos-sin-pago',
    '0 8 * * *',                                  -- 8 AM UTC = 3 AM Colombia
    'SELECT borrar_pedidos_antiguos_sin_pago()'
  );
END;
$$;


-- ============================================================
-- Verificación post-migración (manual):
-- ============================================================
-- 1. Ver que el job quedó programado:
--      SELECT jobname, schedule, command FROM cron.job
--      WHERE jobname = 'borrar-pedidos-sin-pago';
--
-- 2. Probar la función sin esperar al cron (preview de cuántos borraría):
--      SELECT p.id, p.numero, p.estado, p.created_at
--      FROM   pedidos p
--      LEFT JOIN pagos pa ON pa.pedido_id = p.id AND pa.estado = 'aprobado'
--      WHERE  p.estado IN ('pendiente', 'cancelado')
--        AND  p.created_at < NOW() - INTERVAL '10 days'
--        AND  pa.id IS NULL;
--
-- 3. Ejecutarla a mano una sola vez:
--      SELECT borrar_pedidos_antiguos_sin_pago();
--      -- retorna el número de pedidos borrados
