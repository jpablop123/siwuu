-- ============================================================
-- Migración 020 — Fix duplicación masiva en carrito_items
--
-- Bug:
--   La tabla tenía UNIQUE (user_id, producto_id, variante), pero
--   `variante` era nullable. PostgreSQL trata cada NULL como distinto
--   en constraints UNIQUE, así que cada "agregar al carrito" de un
--   producto sin variante creaba una fila NUEVA en lugar de incrementar
--   la cantidad. Resultado: tabla con miles de filas duplicadas.
--
-- Fix:
--   Forzar `variante` NOT NULL con default ''. Así el UNIQUE existing
--   funciona correctamente: dos filas con (user, producto, '') chocan
--   y el ON CONFLICT del upsert incrementa cantidad como debería.
--
-- IMPORTANTE: antes de aplicar esto correr un TRUNCATE para limpiar
-- las filas duplicadas existentes:
--   TRUNCATE TABLE carrito_items;
--
-- (los carritos del cliente se rehidratan desde localStorage la
--  próxima vez que abren la app — no se pierde data crítica)
-- ============================================================

-- 1. Normalizar nulls existentes a ''
UPDATE carrito_items SET variante = '' WHERE variante IS NULL;

-- 2. Schema: NOT NULL con default ''
ALTER TABLE carrito_items ALTER COLUMN variante SET DEFAULT '';
ALTER TABLE carrito_items ALTER COLUMN variante SET NOT NULL;

-- La UNIQUE (user_id, producto_id, variante) que ya existía ahora
-- funciona correctamente porque variante nunca es NULL.

-- Verificación:
--   SELECT user_id, producto_id, variante, COUNT(*)
--   FROM carrito_items
--   GROUP BY 1, 2, 3
--   HAVING COUNT(*) > 1;
-- → debe devolver 0 filas (sin duplicados)
