-- ============================================================
-- Migración 007 — Integridad transaccional de pedidos
--
-- 1. SEQUENCE para numeración de pedidos concurrente y segura
-- 2. Función de expiración automática (pedidos pendientes > 30 min)
-- 3. Cron job vía pg_cron (cada 5 minutos)
--
-- REQUISITOS:
--   - Extensión pg_cron habilitada en Supabase:
--     Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================================


-- ============================================================
-- 1. SEQUENCE atómica para números de pedido
--
-- Reemplaza el COUNT(*)+1 anterior que era inseguro bajo
-- concurrencia. PostgreSQL garantiza que nextval() es atómico
-- y nunca devuelve el mismo valor a dos transacciones.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq
  START 1
  INCREMENT 1
  NO MAXVALUE
  CACHE 1;          -- CACHE 1 = sin pre-allocación; máxima exactitud

-- Sincronizar la secuencia con los pedidos existentes para no
-- generar números duplicados si ya hay datos en producción
SELECT setval(
  'pedido_numero_seq',
  GREATEST((SELECT COUNT(*) FROM pedidos), 0)
);

-- Reemplazar la función existente para usar la secuencia
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
VOLATILE                   -- nextval() no es STABLE ni IMMUTABLE
AS $$
  SELECT 'PED-' || LPAD(nextval('pedido_numero_seq')::TEXT, 5, '0');
$$;


-- ============================================================
-- 2. Función de expiración de pedidos pendientes
--
-- Cancela pedidos en estado 'pendiente' con más de 30 minutos
-- de antigüedad y restaura el stock de cada uno.
--
-- Uso de FOR UPDATE SKIP LOCKED:
--   Permite que dos ejecuciones concurrentes del cron (edge case)
--   no generen deadlocks: cada worker toma filas distintas.
--
-- Retorna: número de pedidos cancelados (útil para logging).
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
    SELECT id
    FROM   pedidos
    WHERE  estado = 'pendiente'
      AND  created_at < NOW() - INTERVAL '30 minutes'
    ORDER BY created_at   -- procesar los más viejos primero
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Restaurar stock antes de marcar cancelado
    -- (restaurar_stock es idempotente: seguro llamarla varias veces)
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


-- ============================================================
-- 3. Cron job con pg_cron
--
-- Ejecuta expirar_pedidos_pendientes() cada 5 minutos.
-- El bloque DO garantiza idempotencia: si el job ya existe
-- lo reemplaza en lugar de fallar.
--
-- NOTA: en Supabase el esquema de pg_cron es "cron" y los jobs
-- se almacenan en la base de datos "postgres". Esta migración
-- debe ejecutarse en el SQL Editor del dashboard de Supabase
-- (no como migración CLI si el CLI apunta a otra DB).
-- ============================================================

DO $$
BEGIN
  -- Eliminar job previo si existe (evita duplicados en re-runs)
  BEGIN
    PERFORM cron.unschedule('expirar-pedidos-pendientes');
  EXCEPTION WHEN OTHERS THEN
    NULL;  -- no existe aún, ignorar
  END;

  -- Registrar el job
  PERFORM cron.schedule(
    'expirar-pedidos-pendientes',   -- nombre único
    '*/5 * * * *',                  -- cada 5 minutos
    'SELECT expirar_pedidos_pendientes()'
  );
END;
$$;


-- ============================================================
-- Verificación post-migración (ejecutar manualmente si querés)
-- ============================================================
-- SELECT * FROM cron.job WHERE jobname = 'expirar-pedidos-pendientes';
-- SELECT generar_numero_pedido();  -- debe devolver PED-00001 (o siguiente)
-- SELECT expirar_pedidos_pendientes();  -- debe devolver 0 si no hay vencidos
