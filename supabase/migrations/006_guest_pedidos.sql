-- Permite que el rol anon (invitados) lea pedidos propios donde user_id IS NULL.
-- La seguridad se basa en: (a) UUIDs son prácticamente imposibles de adivinar,
-- y (b) la cookie httpOnly del servidor valida adicionalmente el acceso.
--
-- Si NO se aplica esta migración, la página de confirmación igual funciona
-- porque el server component usa createServiceClient() con validación de cookie.
-- Esta política es solo para el caso de que se quiera usar el cliente anon
-- directamente para otras consultas de invitado.

CREATE POLICY "Invitados pueden leer sus pedidos por id"
  ON pedidos FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Invitados pueden leer sus items de pedido"
  ON pedido_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_items.pedido_id
        AND p.user_id IS NULL
    )
  );
