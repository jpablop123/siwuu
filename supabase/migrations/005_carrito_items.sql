CREATE TABLE IF NOT EXISTS carrito_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  precio      NUMERIC(12, 2) NOT NULL,
  imagen      TEXT,
  variante    TEXT,
  cantidad    INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, producto_id, variante)
);

CREATE INDEX idx_carrito_items_user ON carrito_items(user_id);
