-- ============================================================
-- Migración 016 — Cron de expiración consciente del método de pago
--
-- Problema:
--   `expirar_pedidos_pendientes()` (migración 007) cancela cualquier
--   pedido con `estado='pendiente'` y más de 30 min. Eso funciona
--   para tarjeta (resuelve en segundos), pero PSE puede tardar
--   horas si el banco demora la confirmación. Cancelábamos pagos
--   legítimos y devolvíamos stock a productos que sí estaban vendidos.
--
-- Solución:
--   El webhook (route.ts) ahora persiste `pagos.metodo` en cuanto
--   recibe el primer evento de la transacción (PENDING para PSE,
--   APPROVED para tarjeta). El cron consulta ese método y aplica:
--
--     PSE / BANCOLOMBIA_TRANSFER  →  4 horas
--     CARD / NEQUI / DAVIPLATA    →  30 minutos
--     metodo IS NULL              →  30 minutos
--         (el usuario abandonó antes de que Wompi disparara
--          el primer webhook → no hay nada que esperar)
--
-- Si más adelante se habilitan métodos cash (SU_RED, EFECTY),
-- agregar acá los rangos correspondientes (típicamente 48–72h).
-- ============================================================

CREATE OR REPLACE FUNCTION expirar_pedidos_pendientes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id UUID;
  v_count     INTEGER := 0;
BEGIN
  FOR v_pedido_id IN
    SELECT p.id
    FROM   pedidos p
    LEFT JOIN LATERAL (
      -- Tomamos el método del pago más reciente del pedido.
      -- LEFT JOIN LATERAL porque puede no haber pago aún.
      SELECT pg.metodo
      FROM   pagos pg
      WHERE  pg.pedido_id = p.id
      ORDER  BY pg.created_at DESC
      LIMIT  1
    ) pg ON TRUE
    WHERE  p.estado = 'pendiente'
      AND  (
        -- Métodos asíncronos: 4 horas
        (pg.metodo IN ('PSE', 'BANCOLOMBIA_TRANSFER')
          AND p.created_at < NOW() - INTERVAL '4 hours')
        OR
        -- Métodos instantáneos o método aún desconocido: 30 minutos
        (
          (pg.metodo IS NULL OR pg.metodo NOT IN ('PSE', 'BANCOLOMBIA_TRANSFER'))
          AND p.created_at < NOW() - INTERVAL '30 minutes'
        )
      )
    ORDER BY p.created_at   -- procesar los más viejos primero
    FOR UPDATE OF p SKIP LOCKED
  LOOP
    -- Restaurar stock antes de marcar cancelado
    -- (restaurar_stock es idempotente)
    PERFORM restaurar_stock(v_pedido_id);

    UPDATE pedidos
    SET    estado     = 'cancelado',
           updated_at = NOW()
    WHERE  id = v_pedido_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- El cron job creado en migración 007 sigue apuntando al mismo
-- nombre de función → `CREATE OR REPLACE` lo deja funcionando sin
-- tocar `cron.schedule`. No hace falta re-schedule.
--
-- Verificación manual:
--   SELECT expirar_pedidos_pendientes();
--   SELECT * FROM cron.job WHERE jobname = 'expirar-pedidos-pendientes';
