-- ============================================================
-- Migración 009 — Tabla de logs de notificaciones por email
--
-- Registra fallos del proveedor de email (Resend) para
-- auditoría y reenvío manual si es necesario.
-- ============================================================

CREATE TABLE IF NOT EXISTS logs_notificaciones (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id          UUID        REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo_email         TEXT        NOT NULL,          -- 'confirmacion' | 'actualizacion_estado' | 'bienvenida'
  email_destinatario TEXT        NOT NULL,
  proveedor_error    TEXT        NOT NULL,          -- mensaje de error devuelto por Resend
  resuelto           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes desde el panel admin
CREATE INDEX IF NOT EXISTS logs_notificaciones_pedido_id_idx    ON logs_notificaciones (pedido_id);
CREATE INDEX IF NOT EXISTS logs_notificaciones_resuelto_idx     ON logs_notificaciones (resuelto) WHERE resuelto = FALSE;
CREATE INDEX IF NOT EXISTS logs_notificaciones_created_at_idx   ON logs_notificaciones (created_at DESC);

-- Solo service_role puede leer/escribir (nunca clientes directos)
ALTER TABLE logs_notificaciones ENABLE ROW LEVEL SECURITY;

-- Ningún rol público tiene acceso — service_role bypasses RLS por diseño
CREATE POLICY "Sin acceso público" ON logs_notificaciones
  FOR ALL TO anon, authenticated USING (false);

-- ============================================================
-- Verificación post-migración
-- ============================================================
-- SELECT * FROM logs_notificaciones ORDER BY created_at DESC LIMIT 10;
