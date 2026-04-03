-- =============================================
-- DROPSHOP — Migración inicial
-- =============================================

-- CATEGORÍAS
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  activa BOOLEAN DEFAULT TRUE,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROVEEDORES
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT,
  email TEXT,
  whatsapp TEXT,
  url_tienda TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTOS
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  descripcion_corta TEXT,
  categoria_id UUID REFERENCES categorias(id),
  proveedor_id UUID REFERENCES proveedores(id),
  precio_venta NUMERIC(12,2) NOT NULL,
  precio_tachado NUMERIC(12,2),
  precio_costo NUMERIC(12,2),
  imagenes TEXT[] DEFAULT '{}',
  destacado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  stock_virtual INT DEFAULT 999,
  url_proveedor TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VARIANTES DE PRODUCTO
CREATE TABLE variantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  valor TEXT NOT NULL,
  precio_adicional NUMERIC(12,2) DEFAULT 0,
  disponible BOOLEAN DEFAULT TRUE
);

-- PERFILES DE USUARIO
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  telefono TEXT,
  cedula TEXT,
  rol TEXT DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIRECCIONES DE ENVÍO
CREATE TABLE direcciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  nombre_destinatario TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  direccion TEXT NOT NULL,
  barrio TEXT,
  indicaciones TEXT,
  principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  email_cliente TEXT NOT NULL,
  nombre_cliente TEXT NOT NULL,
  telefono_cliente TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  direccion_envio TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  costo_envio NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (
    estado IN ('pendiente','pago_confirmado','procesando','enviado_proveedor','en_camino','entregado','cancelado')
  ),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITEMS DEL PEDIDO
CREATE TABLE pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,
  imagen_producto TEXT,
  variante TEXT,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL
);

-- PAGOS
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'COP',
  metodo TEXT,
  wompi_referencia TEXT UNIQUE,
  wompi_transaction_id TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado','anulado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCIONES
-- =============================================

-- Generar número de pedido secuencial
CREATE OR REPLACE FUNCTION generar_numero_pedido() RETURNS TEXT AS $$
DECLARE
  nuevo_num INT;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO nuevo_num FROM pedidos;
  RETURN 'PED-' || LPAD(nuevo_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;

-- Productos y categorías: lectura pública
CREATE POLICY "productos_lectura_publica" ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY "categorias_lectura_publica" ON categorias FOR SELECT USING (activa = TRUE);

-- Perfiles
CREATE POLICY "usuario_ve_su_perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "usuario_edita_su_perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Direcciones
CREATE POLICY "usuario_gestiona_direcciones" ON direcciones FOR ALL USING (auth.uid() = user_id);

-- Pedidos
CREATE POLICY "usuario_ve_sus_pedidos" ON pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_crea_pedido" ON pedidos FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Items de pedido
CREATE POLICY "usuario_ve_items_pedido" ON pedido_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND user_id = auth.uid())
);

-- Pagos
CREATE POLICY "usuario_ve_sus_pagos" ON pagos FOR SELECT USING (
  EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND user_id = auth.uid())
);

-- Admin: acceso total
CREATE POLICY "admin_full_profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_pedidos" ON pedidos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_pedido_items" ON pedido_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_pagos" ON pagos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_productos" ON productos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_categorias" ON categorias FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_variantes" ON variantes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_proveedores" ON proveedores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "admin_full_direcciones" ON direcciones FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Índices útiles
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_productos_destacado ON productos(destacado) WHERE activo = TRUE;
CREATE INDEX idx_pedidos_user ON pedidos(user_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX idx_variantes_producto ON variantes(producto_id);
