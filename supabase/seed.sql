-- =============================================
-- SEED DATA — Datos de ejemplo
-- =============================================

-- Categorías (crear desde el panel admin)

-- Proveedores
INSERT INTO proveedores (id, nombre, contacto, email, whatsapp, url_tienda) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'TechDrop China', 'Li Wei', 'li@techdrop.cn', '+8613800138000', 'https://techdrop.example.com'),
  ('p1000000-0000-0000-0000-000000000002', 'ModaLatam', 'Carolina Ruiz', 'carolina@modalatam.co', '+573001234567', 'https://modalatam.example.com');

-- Productos
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, categoria_id, proveedor_id, precio_venta, precio_tachado, precio_costo, imagenes, destacado, tags) VALUES
(
  'Audífonos Bluetooth Pro',
  'audifonos-bluetooth-pro',
  '<p>Audífonos inalámbricos con cancelación de ruido activa, batería de 30 horas y estuche de carga magnético. Compatibles con iOS y Android.</p><ul><li>Cancelación de ruido activa</li><li>Bluetooth 5.3</li><li>30 horas de batería</li></ul>',
  'Audífonos inalámbricos con cancelación de ruido y 30h de batería',
  'c1000000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  89900, 129900, 35000,
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600'],
  TRUE,
  ARRAY['bluetooth', 'audio', 'oferta']
),
(
  'Smartwatch Deportivo X1',
  'smartwatch-deportivo-x1',
  '<p>Reloj inteligente resistente al agua con monitor cardíaco, GPS integrado y más de 20 modos deportivos. Pantalla AMOLED de 1.4 pulgadas.</p>',
  'Smartwatch con GPS, monitor cardíaco y pantalla AMOLED',
  'c1000000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  159900, 219900, 62000,
  ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
  TRUE,
  ARRAY['smartwatch', 'deporte', 'oferta']
),
(
  'Camiseta Oversize Urban',
  'camiseta-oversize-urban',
  '<p>Camiseta de algodón premium 100% con corte oversize. Disponible en varios colores. Ideal para un look urbano y casual.</p>',
  'Camiseta algodón premium corte oversize',
  'c1000000-0000-0000-0000-000000000002',
  'p1000000-0000-0000-0000-000000000002',
  49900, NULL, 18000,
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'],
  FALSE,
  ARRAY['ropa', 'casual', 'algodón']
),
(
  'Zapatillas Running Air',
  'zapatillas-running-air',
  '<p>Zapatillas ultraligeras con suela de espuma reactiva y malla transpirable. Ideales para correr o uso diario.</p>',
  'Zapatillas ultraligeras con suela reactiva',
  'c1000000-0000-0000-0000-000000000002',
  'p1000000-0000-0000-0000-000000000002',
  189900, 249900, 75000,
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600'],
  TRUE,
  ARRAY['calzado', 'deporte', 'oferta']
),
(
  'Lámpara LED Inteligente',
  'lampara-led-inteligente',
  '<p>Lámpara de escritorio con 5 niveles de brillo, temperatura de color ajustable y puerto USB de carga. Control táctil.</p>',
  'Lámpara LED con brillo ajustable y puerto USB',
  'c1000000-0000-0000-0000-000000000003',
  'p1000000-0000-0000-0000-000000000001',
  69900, 99900, 28000,
  ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057ab856?w=600'],
  FALSE,
  ARRAY['hogar', 'LED', 'escritorio']
),
(
  'Organizador de Cocina Bambú',
  'organizador-cocina-bambu',
  '<p>Organizador multiusos de bambú natural para especias, utensilios y condimentos. 3 niveles con cajones deslizables.</p>',
  'Organizador de bambú natural 3 niveles',
  'c1000000-0000-0000-0000-000000000003',
  'p1000000-0000-0000-0000-000000000002',
  79900, NULL, 32000,
  ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
  FALSE,
  ARRAY['cocina', 'bambú', 'organización']
),
(
  'Kit Skincare Coreano 5 Pasos',
  'kit-skincare-coreano',
  '<p>Kit completo de rutina coreana: limpiador, tónico, sérum de vitamina C, crema hidratante y protector solar. Para todo tipo de piel.</p>',
  'Kit completo skincare coreano de 5 pasos',
  'c1000000-0000-0000-0000-000000000004',
  'p1000000-0000-0000-0000-000000000001',
  129900, 179900, 48000,
  ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600', 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=600'],
  TRUE,
  ARRAY['skincare', 'coreano', 'oferta']
),
(
  'Paleta de Sombras Sunset',
  'paleta-sombras-sunset',
  '<p>Paleta de 12 tonos cálidos con acabados mate, shimmer y glitter. Altamente pigmentados y de larga duración.</p>',
  'Paleta 12 tonos cálidos mate y shimmer',
  'c1000000-0000-0000-0000-000000000004',
  'p1000000-0000-0000-0000-000000000002',
  59900, 89900, 22000,
  ARRAY['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600'],
  FALSE,
  ARRAY['maquillaje', 'sombras', 'oferta']
);

-- Variantes para algunos productos
INSERT INTO variantes (producto_id, nombre, valor) VALUES
  ((SELECT id FROM productos WHERE slug = 'audifonos-bluetooth-pro'), 'Color', 'Negro'),
  ((SELECT id FROM productos WHERE slug = 'audifonos-bluetooth-pro'), 'Color', 'Blanco'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Talla', 'S'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Talla', 'M'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Talla', 'L'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Talla', 'XL'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Color', 'Negro'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Color', 'Blanco'),
  ((SELECT id FROM productos WHERE slug = 'camiseta-oversize-urban'), 'Color', 'Beige'),
  ((SELECT id FROM productos WHERE slug = 'zapatillas-running-air'), 'Talla', '38'),
  ((SELECT id FROM productos WHERE slug = 'zapatillas-running-air'), 'Talla', '40'),
  ((SELECT id FROM productos WHERE slug = 'zapatillas-running-air'), 'Talla', '42'),
  ((SELECT id FROM productos WHERE slug = 'zapatillas-running-air'), 'Talla', '44');
