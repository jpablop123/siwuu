-- ============================================================
-- Seed — Carga inicial de productos Apple / Samsung / Prodigee
--
-- Origen: lista del proveedor (USD).
-- Conversión usada: $1 USD = $4.200 COP.
-- Markup aplicado: 50% sobre el costo (precio_venta = costo × 1.5).
-- Precio tachado: precio_venta × 1.2 (para mostrar "descuento").
-- Stock virtual: cantidad listada en la columna Qty del proveedor.
--
-- Cómo correrlo: copiar todo y pegarlo en el SQL Editor de Supabase.
-- ON CONFLICT garantiza idempotencia — podés re-ejecutarlo sin duplicar.
-- ============================================================


-- ── 1. Categorías necesarias ─────────────────────────────────────

INSERT INTO categorias (nombre, slug, descripcion, activa, orden) VALUES
  ('Cargadores',   'cargadores',   'Adaptadores de pared y cargadores de viaje',                      TRUE, 10),
  ('Cables',       'cables',       'Cables de carga y datos USB-C, Lightning, etc.',                   TRUE, 20),
  ('Audífonos',    'audifonos',    'EarPods, AirPods y audífonos premium',                             TRUE, 30),
  ('Power Banks',  'power-banks',  'Baterías portátiles y cargadores inalámbricos para llevar',        TRUE, 40),
  ('Accesorios Auto', 'accesorios-auto', 'Cargadores para auto y accesorios de movilidad',             TRUE, 50)
ON CONFLICT (slug) DO NOTHING;


-- ── 2. Productos ─────────────────────────────────────────────────
--
-- Patrón: cada INSERT calcula precio_venta = costo_cop * 1.5
--                                 precio_tachado = precio_venta * 1.2
--
-- Si modificás los precios desde el admin, esto no se sobreescribe
-- gracias a ON CONFLICT (slug) DO NOTHING.

WITH costos AS (
  SELECT * FROM (VALUES
    -- (slug,                                  nombre,                                                  descripcion_corta,                  categoria_slug, costo_usd,  stock)
    ('apple-home-power-adapter-20w-usb-c',     'Apple Home Power Adapter 20W USB-C',                    'Adaptador de pared 20W con USB-C, ideal para iPhone y iPad', 'cargadores',  20.12, 10),
    ('apple-earpods-usb-c',                    'Apple EarPods (USB-C)',                                 'Audífonos cableados Apple con conector USB-C',                'audifonos',   19.85,  5),
    ('apple-earpods-lightning',                'Apple EarPods Lightning (A1748)',                       'Audífonos cableados Apple con conector Lightning',            'audifonos',   19.85,  5),
    ('apple-usb-c-to-usb-c-woven-cable-1m',    'Apple USB-C a USB-C Woven Cable 1M',                    'Cable trenzado USB-C a USB-C de 1 metro, original Apple',     'cables',      14.85, 10),
    ('apple-cable-type-c-to-lightning',        'Apple Cable Type-C a Lightning',                        'Cable de carga USB-C a Lightning para iPhone',                'cables',      14.85, 10),
    ('prodigee-mag-power-to-go-10k-cream',     'Prodigee Mag Power To Go 10K (Cream)',                  'Power bank magnético MagSafe 10.000 mAh — color crema',       'power-banks', 43.20,  1),
    ('prodigee-mag-power-to-go-10k-metallic',  'Prodigee Mag Power To Go 10K (Metallic)',               'Power bank magnético MagSafe 10.000 mAh — color metálico',    'power-banks', 43.20,  1),
    ('prodigee-energee-mini-car-charger',      'Prodigee Energee Mini Car Charger',                     'Cargador compacto para auto con USB-C de alta velocidad',     'accesorios-auto', 10.13, 2),
    ('prodigee-mag-da-beat-silver',            'Prodigee Mag Da Beat (Silver)',                         'Cargador inalámbrico magnético de escritorio — plateado',     'power-banks', 22.95,  2),
    ('samsung-travel-charger-45w',             'Samsung Travel Charger 45W con cable C-to-C',           'Cargador de viaje Samsung 45W con cable USB-C incluido',      'cargadores',  35.78,  3),
    ('samsung-travel-charger-25w-black',       'Samsung Travel Charger 25W USB-C (Negro)',              'Cargador rápido Samsung 25W con USB-C — negro',               'cargadores',  16.88,  4),
    ('samsung-travel-charger-25w-white',       'Samsung Travel Charger 25W USB-C (Blanco)',             'Cargador rápido Samsung 25W con USB-C — blanco',              'cargadores',  16.88,  2)
  ) AS t(slug, nombre, descripcion_corta, categoria_slug, costo_usd, stock)
)
INSERT INTO productos (
  nombre, slug, descripcion_corta, categoria_id,
  precio_costo, precio_venta, precio_tachado,
  imagenes, destacado, activo, stock_virtual
)
SELECT
  c.nombre,
  c.slug,
  c.descripcion_corta,
  cat.id,
  ROUND(c.costo_usd * 4200)::NUMERIC                       AS precio_costo,
  ROUND(c.costo_usd * 4200 * 1.5)::NUMERIC                 AS precio_venta,
  ROUND(c.costo_usd * 4200 * 1.5 * 1.2)::NUMERIC           AS precio_tachado,
  ARRAY[]::TEXT[]                                          AS imagenes,
  FALSE                                                    AS destacado,
  TRUE                                                     AS activo,
  c.stock                                                  AS stock_virtual
FROM costos c
JOIN categorias cat ON cat.slug = c.categoria_slug
ON CONFLICT (slug) DO NOTHING;


-- ── 3. Verificación ──────────────────────────────────────────────
-- SELECT nombre, precio_venta, stock_virtual FROM productos
-- WHERE slug LIKE 'apple-%' OR slug LIKE 'prodigee-%' OR slug LIKE 'samsung-%'
-- ORDER BY categoria_id, nombre;
