/**
 * Tipos de base de datos para el cliente de Supabase.
 *
 * Escrito manualmente a partir del esquema en supabase/migrations/.
 * Elimina todos los `any` en los clientes y habilita autocompletado
 * en .from(), .select(), .insert(), .update() y .rpc().
 *
 * PARA REGENERAR CON EL CLI (al añadir tablas o columnas):
 *   npx supabase login
 *   npx supabase gen types typescript --project-id swipvkzxqtxpruftszsq > src/types/database.ts
 *
 * Script de conveniencia (agregar a package.json):
 *   "db:types": "supabase gen types typescript --project-id swipvkzxqtxpruftszsq > src/types/database.ts"
 *
 * NOTA: Todas las tablas deben incluir `Relationships: []` para que
 * @supabase/postgrest-js ≥2.x infiera correctamente los tipos Insert/Update.
 * Sin este campo el compilador degrada el tipo a `never`.
 */

type EstadoPedido = 'pendiente' | 'pago_confirmado' | 'procesando' | 'enviado_proveedor' | 'en_camino' | 'entregado' | 'cancelado'
type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado'
type RolUsuario = 'cliente' | 'admin'
type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    PostgrestVersion: '12'
    Tables: {
      categorias: {
        Row: { id: string; nombre: string; slug: string; descripcion: string | null; imagen_url: string | null; activa: boolean; orden: number; created_at: string }
        Insert: { id?: string; nombre: string; slug: string; descripcion?: string | null; imagen_url?: string | null; activa?: boolean; orden?: number; created_at?: string }
        Update: { nombre?: string; slug?: string; descripcion?: string | null; imagen_url?: string | null; activa?: boolean; orden?: number }
        Relationships: []
      }
      proveedores: {
        Row: { id: string; nombre: string; contacto: string | null; email: string | null; whatsapp: string | null; url_tienda: string | null; notas: string | null; activo: boolean; created_at: string }
        Insert: { id?: string; nombre: string; contacto?: string | null; email?: string | null; whatsapp?: string | null; url_tienda?: string | null; notas?: string | null; activo?: boolean; created_at?: string }
        Update: { nombre?: string; contacto?: string | null; email?: string | null; whatsapp?: string | null; url_tienda?: string | null; notas?: string | null; activo?: boolean }
        Relationships: []
      }
      productos: {
        Row: { id: string; nombre: string; slug: string; descripcion: string | null; descripcion_corta: string | null; categoria_id: string | null; proveedor_id: string | null; precio_venta: number; precio_tachado: number | null; precio_costo: number | null; imagenes: string[]; destacado: boolean; activo: boolean; stock_virtual: number; url_proveedor: string | null; tags: string[]; created_at: string; updated_at: string }
        Insert: { id?: string; nombre: string; slug: string; descripcion?: string | null; descripcion_corta?: string | null; categoria_id?: string | null; proveedor_id?: string | null; precio_venta: number; precio_tachado?: number | null; precio_costo?: number | null; imagenes?: string[]; destacado?: boolean; activo?: boolean; stock_virtual?: number; url_proveedor?: string | null; tags?: string[]; created_at?: string; updated_at?: string }
        Update: { nombre?: string; slug?: string; descripcion?: string | null; descripcion_corta?: string | null; categoria_id?: string | null; proveedor_id?: string | null; precio_venta?: number; precio_tachado?: number | null; precio_costo?: number | null; imagenes?: string[]; destacado?: boolean; activo?: boolean; stock_virtual?: number; url_proveedor?: string | null; tags?: string[]; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'productos_categoria_id_fkey'; columns: ['categoria_id']; referencedRelation: 'categorias'; referencedColumns: ['id'] },
          { foreignKeyName: 'productos_proveedor_id_fkey'; columns: ['proveedor_id']; referencedRelation: 'proveedores'; referencedColumns: ['id'] }
        ]
      }
      variantes: {
        Row: { id: string; producto_id: string; nombre: string; valor: string; precio_adicional: number; disponible: boolean }
        Insert: { id?: string; producto_id: string; nombre: string; valor: string; precio_adicional?: number; disponible?: boolean }
        Update: { nombre?: string; valor?: string; precio_adicional?: number; disponible?: boolean }
        Relationships: [
          { foreignKeyName: 'variantes_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'productos'; referencedColumns: ['id'] }
        ]
      }
      profiles: {
        Row: { id: string; nombre: string | null; telefono: string | null; cedula: string | null; rol: RolUsuario; created_at: string }
        Insert: { id: string; nombre?: string | null; telefono?: string | null; cedula?: string | null; rol?: RolUsuario; created_at?: string }
        Update: { nombre?: string | null; telefono?: string | null; cedula?: string | null; rol?: RolUsuario }
        Relationships: []
      }
      direcciones: {
        Row: { id: string; user_id: string; nombre_destinatario: string; telefono: string; ciudad: string; departamento: string; direccion: string; barrio: string | null; indicaciones: string | null; principal: boolean; created_at: string }
        Insert: { id?: string; user_id: string; nombre_destinatario: string; telefono: string; ciudad: string; departamento: string; direccion: string; barrio?: string | null; indicaciones?: string | null; principal?: boolean; created_at?: string }
        Update: { nombre_destinatario?: string; telefono?: string; ciudad?: string; departamento?: string; direccion?: string; barrio?: string | null; indicaciones?: string | null; principal?: boolean }
        Relationships: []
      }
      pedidos: {
        Row: { id: string; numero: string; user_id: string | null; token_acceso: string; email_cliente: string; nombre_cliente: string; telefono_cliente: string; ciudad: string; departamento: string; direccion_envio: string; subtotal: number; costo_envio: number; total: number; estado: EstadoPedido; notas: string | null; numero_guia: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; numero: string; user_id?: string | null; token_acceso?: string; email_cliente: string; nombre_cliente: string; telefono_cliente: string; ciudad: string; departamento: string; direccion_envio: string; subtotal: number; costo_envio: number; total: number; estado?: EstadoPedido; notas?: string | null; created_at?: string; updated_at?: string }
        Update: { estado?: EstadoPedido; notas?: string | null; nombre_cliente?: string; telefono_cliente?: string; ciudad?: string; departamento?: string; direccion_envio?: string; numero_guia?: string | null; updated_at?: string }
        Relationships: []
      }
      pedido_items: {
        Row: { id: string; pedido_id: string; producto_id: string; nombre_producto: string; imagen_producto: string | null; variante: string | null; cantidad: number; precio_unitario: number; subtotal: number }
        Insert: { id?: string; pedido_id: string; producto_id: string; nombre_producto: string; imagen_producto?: string | null; variante?: string | null; cantidad: number; precio_unitario: number; subtotal: number }
        Update: { nombre_producto?: string; imagen_producto?: string | null; variante?: string | null; cantidad?: number; precio_unitario?: number; subtotal?: number }
        Relationships: [
          { foreignKeyName: 'pedido_items_pedido_id_fkey'; columns: ['pedido_id']; referencedRelation: 'pedidos'; referencedColumns: ['id'] },
          { foreignKeyName: 'pedido_items_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'productos'; referencedColumns: ['id'] }
        ]
      }
      pagos: {
        Row: { id: string; pedido_id: string; monto: number; moneda: string; metodo: string | null; wompi_referencia: string | null; wompi_transaction_id: string | null; estado: EstadoPago; created_at: string }
        Insert: { id?: string; pedido_id: string; monto: number; moneda?: string; metodo?: string | null; wompi_referencia?: string | null; wompi_transaction_id?: string | null; estado?: EstadoPago; created_at?: string }
        Update: { monto?: number; moneda?: string; metodo?: string | null; wompi_referencia?: string | null; wompi_transaction_id?: string | null; estado?: EstadoPago }
        Relationships: [
          { foreignKeyName: 'pagos_pedido_id_fkey'; columns: ['pedido_id']; referencedRelation: 'pedidos'; referencedColumns: ['id'] }
        ]
      }
      carrito_items: {
        Row: { id: string; user_id: string; producto_id: string; nombre: string; precio: number; imagen: string | null; variante: string | null; cantidad: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; producto_id: string; nombre: string; precio: number; imagen?: string | null; variante?: string | null; cantidad?: number; created_at?: string; updated_at?: string }
        Update: { nombre?: string; precio?: number; imagen?: string | null; variante?: string | null; cantidad?: number; updated_at?: string }
        Relationships: []
      }
      logs_notificaciones: {
        Row: { id: string; pedido_id: string | null; tipo_email: string; email_destinatario: string; proveedor_error: string; resuelto: boolean; created_at: string }
        Insert: { id?: string; pedido_id?: string | null; tipo_email: string; email_destinatario: string; proveedor_error: string; resuelto?: boolean; created_at?: string }
        Update: { resuelto?: boolean }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      generar_numero_pedido:      { Args: Record<PropertyKey, never>; Returns: string }
      decrementar_stock:          { Args: { p_producto_id: string; p_cantidad: number }; Returns: undefined }
      restaurar_stock:            { Args: { p_pedido_id: string }; Returns: undefined }
      es_admin:                   { Args: Record<PropertyKey, never>; Returns: boolean }
      expirar_pedidos_pendientes: { Args: Record<PropertyKey, never>; Returns: number }
      ventas_por_dia_30:          { Args: Record<PropertyKey, never>; Returns: Array<{ fecha: string; total: number }> }
      top_productos_5:            { Args: Record<PropertyKey, never>; Returns: Array<{ nombre: string; unidades: number; ingresos: number }> }
      procesar_checkout_atomico: {
        Args: {
          p_pedido_id:    string
          p_numero:       string
          p_user_id:      string | null
          p_email:        string
          p_nombre:       string
          p_telefono:     string
          p_ciudad:       string
          p_departamento: string
          p_direccion:    string
          p_subtotal:     number
          p_costo_envio:  number
          p_total:        number
          p_items:        Json
          p_referencia:   string
        }
        Returns: Array<{ pedido_id: string; token_acceso: string }>
      }
    }
    Enums: { [_ in never]: never }
  }
}
