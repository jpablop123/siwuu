-- ============================================================
-- Migración 010 — token_acceso para pedidos de invitados + Realtime
--
-- 1. Agrega token_acceso (UUID) a pedidos — reemplaza la cookie
--    de presencia '1' por un secret criptográfico verificable.
--
-- 2. Habilita publicación Realtime en la tabla pedidos para que
--    el cliente pueda suscribirse a cambios via postgres_changes.
-- ============================================================

-- ── 1. Columna token_acceso ───────────────────────────────────────────
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS token_acceso UUID NOT NULL DEFAULT gen_random_uuid();

-- Índice para búsquedas por token (validation en gracias/[id])
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_token_acceso_idx ON pedidos (token_acceso);

-- ── 2. Realtime publication ───────────────────────────────────────────
-- Habilita cambios en tiempo real para la tabla pedidos.
-- Necesario para que PedidoEstado.tsx reciba el UPDATE del webhook
-- instantáneamente via supabase.channel().on('postgres_changes', ...).
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;

-- ============================================================
-- Verificación post-migración
-- ============================================================
-- SELECT id, token_acceso FROM pedidos LIMIT 3;
-- SELECT pubname, tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos';
