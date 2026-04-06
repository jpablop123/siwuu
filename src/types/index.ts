export interface Categoria {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen_url: string | null
  activa: boolean
  orden: number
  created_at: string
}

export interface Proveedor {
  id: string
  nombre: string
  contacto: string | null
  email: string | null
  whatsapp: string | null
  url_tienda: string | null
  notas: string | null
  activo: boolean
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  descripcion_corta: string | null
  categoria_id: string | null
  proveedor_id: string | null
  precio_venta: number
  precio_tachado: number | null
  precio_costo: number | null
  imagenes: string[]
  destacado: boolean
  activo: boolean
  stock_virtual: number
  url_proveedor: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // Joined
  categoria?: Categoria
  proveedor?: Proveedor
  variantes?: Variante[]
}

export interface Variante {
  id: string
  producto_id: string
  nombre: string
  valor: string
  precio_adicional: number
  disponible: boolean
}

export interface Profile {
  id: string
  nombre: string | null
  telefono: string | null
  cedula: string | null
  rol: 'cliente' | 'admin'
  created_at: string
}

export interface Direccion {
  id: string
  user_id: string
  nombre_destinatario: string
  telefono: string
  ciudad: string
  departamento: string
  direccion: string
  barrio: string | null
  indicaciones: string | null
  principal: boolean
  created_at: string
}

export interface Pedido {
  id: string
  numero: string
  user_id: string | null
  token_acceso: string
  numero_guia: string | null
  email_cliente: string
  nombre_cliente: string
  telefono_cliente: string
  ciudad: string
  departamento: string
  direccion_envio: string
  subtotal: number
  costo_envio: number
  total: number
  estado: EstadoPedido
  notas: string | null
  created_at: string
  updated_at: string
  // Joined
  items?: PedidoItem[]
  pagos?: Pago[]
}

export type EstadoPedido =
  | 'pendiente'
  | 'pago_confirmado'
  | 'procesando'
  | 'enviado_proveedor'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  nombre_producto: string
  imagen_producto: string | null
  variante: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Pago {
  id: string
  pedido_id: string
  monto: number
  moneda: string
  metodo: string | null
  wompi_referencia: string | null
  wompi_transaction_id: string | null
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'anulado'
  created_at: string
}

export interface CartItem {
  id: string
  productoId: string
  nombre: string
  precio: number
  imagen: string
  variante?: string
  cantidad: number
}

export interface WompiTransaction {
  id: string
  status: string
  reference: string
  amount_in_cents: number
  payment_method_type: string
  created_at: string
}
