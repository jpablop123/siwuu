'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { enviarEmailActualizacionEstado } from '@/lib/resend/emails'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------------
// Verificación admin — OBLIGATORIA antes de cada acción
// ---------------------------------------------------------------------------

async function verificarAdmin() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')

  // Usar service client para bypass de RLS al verificar rol
  const serviceClient = createServiceClient()
  const { data: perfil } = await serviceClient
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') throw new Error('No autorizado')
  return { supabase: serviceClient, user }
}

// ---------------------------------------------------------------------------
// Métricas del Dashboard
// ---------------------------------------------------------------------------

export async function obtenerMetricasDashboard(): Promise<{
  ventasMes: number
  pedidosHoy: number
  pedidosPendientes: number
  totalClientes: number
  ventasPorDia: Array<{ fecha: string; total: number }>
  topProductos: Array<{ nombre: string; unidades: number; ingresos: number }>
}> {
  const { supabase } = await verificarAdmin()

  const estadosValidos: import('@/types').EstadoPedido[] = [
    'pago_confirmado',
    'procesando',
    'enviado_proveedor',
    'en_camino',
    'entregado',
  ]

  const [ventasMesRes, pedidosHoyRes, pedidosPendientesRes, totalClientesRes, ventasPorDiaRes, topProductosRes] =
    await Promise.all([
      // 1. Ventas del mes
      supabase
        .from('pedidos')
        .select('total')
        .in('estado', estadosValidos)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // 2. Pedidos hoy
      supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      // 3. Pedidos pendientes
      supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['pendiente', 'pago_confirmado']),

      // 4. Total clientes
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('rol', 'cliente'),

      // 5. Ventas por día (últimos 30 días)
      supabase.rpc('ventas_por_dia_30'),

      // 6. Top productos
      supabase.rpc('top_productos_5'),
    ])

  // Calcular ventas del mes sumando los totales
  const ventasMes = (ventasMesRes.data || []).reduce((sum, p) => sum + (p.total || 0), 0)

  // Fallback para ventas por día si el RPC no existe
  const ventasPorDia: Array<{ fecha: string; total: number }> = Array.isArray(ventasPorDiaRes.data)
    ? ventasPorDiaRes.data.map((r: { fecha: string; total: number }) => ({
        fecha: r.fecha,
        total: Number(r.total),
      }))
    : []

  // Fallback para top productos si el RPC no existe
  const topProductos: Array<{ nombre: string; unidades: number; ingresos: number }> = Array.isArray(
    topProductosRes.data
  )
    ? topProductosRes.data.map((r: { nombre: string; unidades: number; ingresos: number }) => ({
        nombre: r.nombre,
        unidades: Number(r.unidades),
        ingresos: Number(r.ingresos),
      }))
    : []

  return {
    ventasMes,
    pedidosHoy: pedidosHoyRes.count ?? 0,
    pedidosPendientes: pedidosPendientesRes.count ?? 0,
    totalClientes: totalClientesRes.count ?? 0,
    ventasPorDia,
    topProductos,
  }
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

const ESTADOS_VALIDOS: import('@/types').EstadoPedido[] = [
  'pago_confirmado',
  'procesando',
  'enviado_proveedor',
  'en_camino',
  'entregado',
  'cancelado',
]

export async function actualizarEstadoPedido(
  pedidoId: string,
  nuevoEstado: string,
  numeroGuia?: string
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  if (!(ESTADOS_VALIDOS as string[]).includes(nuevoEstado)) {
    return { error: 'Estado inválido' }
  }

  const updateObj: Record<string, unknown> = {
    estado: nuevoEstado,
    updated_at: new Date().toISOString(),
  }

  if (numeroGuia && numeroGuia.trim() !== '') {
    updateObj.numero_guia = numeroGuia.trim()
  }

  const { error } = await supabase.from('pedidos').update(updateObj).eq('id', pedidoId)

  if (error) return { error: error.message }

  // Email de actualización — best effort
  try {
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('numero, nombre_cliente, email_cliente, numero_guia')
      .eq('id', pedidoId)
      .single()

    if (pedido) {
      await enviarEmailActualizacionEstado({
        email: pedido.email_cliente,
        nombre: pedido.nombre_cliente,
        numeroPedido: pedido.numero,
        pedidoId,
        nuevoEstado,
        numeroGuia: numeroGuia ?? pedido.numero_guia,
      })
    }
  } catch {
    // El error ya queda registrado en logs_notificaciones por enviarEmailActualizacionEstado
  }

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${pedidoId}`)
  revalidatePath('/cuenta/pedidos')
  return { ok: true }
}

export async function cancelarPedidoAction(
  pedidoId: string
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  // Verificar que el pedido existe y se puede cancelar
  const { data: pedido, error: fetchError } = await supabase
    .from('pedidos')
    .select('id, numero, nombre_cliente, email_cliente, estado')
    .eq('id', pedidoId)
    .single()

  if (fetchError || !pedido) return { error: 'Pedido no encontrado' }

  const ESTADOS_NO_CANCELABLES = ['entregado', 'cancelado']
  if (ESTADOS_NO_CANCELABLES.includes(pedido.estado)) {
    return { error: `No se puede cancelar un pedido en estado "${pedido.estado}"` }
  }

  // Restaurar stock antes de cancelar
  const { error: stockError } = await supabase.rpc('restaurar_stock', { p_pedido_id: pedidoId })
  if (stockError) return { error: `Error al restaurar stock: ${stockError.message}` }

  // Actualizar estado
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', pedidoId)

  if (updateError) return { error: updateError.message }

  // Email — best effort (los fallos quedan en logs_notificaciones)
  try {
    await enviarEmailActualizacionEstado({
      email: pedido.email_cliente,
      nombre: pedido.nombre_cliente,
      numeroPedido: pedido.numero,
      pedidoId,
      nuevoEstado: 'cancelado',
    })
  } catch {
    // ignorar — ya persistido en BD por el helper
  }

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${pedidoId}`)
  revalidatePath('/cuenta/pedidos')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------

export async function subirImagen(
  formData: FormData
): Promise<{ ok?: boolean; url?: string; error?: string }> {
  const { supabase } = await verificarAdmin()

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return { error: 'No se recibió archivo' }
  }

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
  if (!tiposPermitidos.includes(file.type)) {
    return { error: 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'El archivo supera 5MB' }
  }

  const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
  const path = `productos/${Date.now()}-${nombreLimpio}`

  const { error: uploadError } = await supabase.storage
    .from('productos_imagenes')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from('productos_imagenes').getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

export async function crearProducto(
  formData: FormData
): Promise<{ ok?: boolean; productoId?: string; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const descripcion = formData.get('descripcion')?.toString().trim() || null
  const descripcionCorta = formData.get('descripcion_corta')?.toString().trim() || null
  const categoriaId = formData.get('categoria_id')?.toString() || null
  const proveedorId = formData.get('proveedor_id')?.toString() || null
  const precioVenta = parseInt(formData.get('precio_venta')?.toString() ?? '0')
  const precioTachado = formData.get('precio_tachado')?.toString()
    ? parseInt(formData.get('precio_tachado')!.toString())
    : null
  const precioCosto = formData.get('precio_costo')?.toString()
    ? parseInt(formData.get('precio_costo')!.toString())
    : null
  const imagenes = JSON.parse(formData.get('imagenes')?.toString() || '[]') as string[]
  const tags = JSON.parse(formData.get('tags')?.toString() || '[]') as string[]
  const destacado = formData.get('destacado') === 'true'
  const activo = formData.get('activo') !== 'false'
  const stockVirtual = parseInt(formData.get('stock_virtual')?.toString() ?? '999')
  const urlProveedor = formData.get('url_proveedor')?.toString().trim() || null
  const variantesNuevas = JSON.parse(formData.get('variantes_nuevas')?.toString() || '[]')

  if (!nombre || !precioVenta) {
    return { error: 'Nombre y precio de venta son requeridos' }
  }

  if (precioTachado && precioTachado <= precioVenta) {
    return { error: 'El precio tachado debe ser mayor al precio de venta' }
  }

  // Generar slug único
  let slug = generarSlug(nombre)
  let slugSuffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabase
      .from('productos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slugSuffix++
    slug = `${generarSlug(nombre)}-${slugSuffix}`
  }

  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre,
      slug,
      descripcion,
      descripcion_corta: descripcionCorta,
      categoria_id: categoriaId,
      proveedor_id: proveedorId,
      precio_venta: precioVenta,
      precio_tachado: precioTachado,
      precio_costo: precioCosto,
      imagenes,
      tags,
      destacado,
      activo,
      stock_virtual: stockVirtual,
      url_proveedor: urlProveedor,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Crear variantes si se pasaron (modo crear)
  if (variantesNuevas.length > 0 && data) {
    const variantesInsert = variantesNuevas.map(
      (v: { nombre: string; valor: string; precio_adicional: number; disponible: boolean }) => ({
        producto_id: data.id,
        nombre: v.nombre,
        valor: v.valor,
        precio_adicional: v.precio_adicional || 0,
        disponible: v.disponible !== false,
      })
    )
    await supabase.from('variantes').insert(variantesInsert)
  }

  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  return { ok: true, productoId: data?.id }
}

export async function actualizarProducto(
  id: string,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const descripcion = formData.get('descripcion')?.toString().trim() || null
  const descripcionCorta = formData.get('descripcion_corta')?.toString().trim() || null
  const categoriaId = formData.get('categoria_id')?.toString() || null
  const proveedorId = formData.get('proveedor_id')?.toString() || null
  const precioVenta = parseInt(formData.get('precio_venta')?.toString() ?? '0')
  const precioTachado = formData.get('precio_tachado')?.toString()
    ? parseInt(formData.get('precio_tachado')!.toString())
    : null
  const precioCosto = formData.get('precio_costo')?.toString()
    ? parseInt(formData.get('precio_costo')!.toString())
    : null
  const imagenes = JSON.parse(formData.get('imagenes')?.toString() || '[]') as string[]
  const tags = JSON.parse(formData.get('tags')?.toString() || '[]') as string[]
  const destacado = formData.get('destacado') === 'true'
  const activo = formData.get('activo') !== 'false'
  const stockVirtual = parseInt(formData.get('stock_virtual')?.toString() ?? '999')
  const urlProveedor = formData.get('url_proveedor')?.toString().trim() || null

  if (!nombre || !precioVenta) {
    return { error: 'Nombre y precio de venta son requeridos' }
  }

  if (precioTachado && precioTachado <= precioVenta) {
    return { error: 'El precio tachado debe ser mayor al precio de venta' }
  }

  // Obtener slug actual para revalidar
  const { data: current } = await supabase.from('productos').select('slug').eq('id', id).single()

  const { error } = await supabase
    .from('productos')
    .update({
      nombre,
      descripcion,
      descripcion_corta: descripcionCorta,
      categoria_id: categoriaId,
      proveedor_id: proveedorId,
      precio_venta: precioVenta,
      precio_tachado: precioTachado,
      precio_costo: precioCosto,
      imagenes,
      tags,
      destacado,
      activo,
      stock_virtual: stockVirtual,
      url_proveedor: urlProveedor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  if (current?.slug) revalidatePath(`/productos/${current.slug}`)
  return { ok: true }
}

export async function toggleProductoActivo(
  id: string,
  activo: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { error } = await supabase
    .from('productos')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  return { ok: true }
}

export async function eliminarProducto(id: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  // Verificar pedidos asociados
  const { count } = await supabase
    .from('pedido_items')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'No se puede eliminar: tiene pedidos asociados. Desactivalo en su lugar.' }
  }

  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/productos')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

export async function crearVariante(
  productoId: string,
  formData: FormData
): Promise<{ ok?: boolean; varianteId?: string; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const valor = formData.get('valor')?.toString().trim() ?? ''
  const precioAdicional = parseFloat(formData.get('precio_adicional')?.toString() ?? '0') || 0
  const disponible = formData.get('disponible') !== 'false'

  if (!nombre || !valor) {
    return { error: 'Nombre y valor son requeridos' }
  }

  const { data, error } = await supabase
    .from('variantes')
    .insert({
      producto_id: productoId,
      nombre,
      valor,
      precio_adicional: precioAdicional,
      disponible,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/productos/${productoId}`)
  return { ok: true, varianteId: data?.id }
}

export async function eliminarVariante(
  id: string,
  productoId: string
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { error } = await supabase.from('variantes').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/admin/productos/${productoId}`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export async function crearCategoria(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const descripcion = formData.get('descripcion')?.toString().trim() || null
  const imagenUrl = formData.get('imagen_url')?.toString().trim() || null
  const orden = parseInt(formData.get('orden')?.toString() ?? '0')

  if (!nombre) return { error: 'Nombre es requerido' }

  // Generar slug único
  let slug = generarSlug(nombre)
  let slugSuffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabase
      .from('categorias')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slugSuffix++
    slug = `${generarSlug(nombre)}-${slugSuffix}`
  }

  const { error } = await supabase.from('categorias').insert({
    nombre,
    slug,
    descripcion,
    imagen_url: imagenUrl,
    activa: true,
    orden,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { ok: true }
}

export async function actualizarCategoria(
  id: string,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const descripcion = formData.get('descripcion')?.toString().trim() || null
  const imagenUrl = formData.get('imagen_url')?.toString().trim() || null
  const orden = parseInt(formData.get('orden')?.toString() ?? '0')
  const activa = formData.get('activa') !== 'false'

  if (!nombre) return { error: 'Nombre es requerido' }

  const { error } = await supabase
    .from('categorias')
    .update({ nombre, descripcion, imagen_url: imagenUrl, orden, activa })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { ok: true }
}

export async function eliminarCategoria(id: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { count } = await supabase
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)
    .eq('activo', true)

  if ((count ?? 0) > 0) {
    return { error: 'Tiene productos activos. Reasigna o desactiva los productos primero.' }
  }

  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/categorias')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------------

export async function crearProveedor(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const contacto = formData.get('contacto')?.toString().trim() || null
  const email = formData.get('email')?.toString().trim() || null
  const whatsapp = formData.get('whatsapp')?.toString().trim() || null
  const urlTienda = formData.get('url_tienda')?.toString().trim() || null
  const notas = formData.get('notas')?.toString().trim() || null

  if (!nombre) return { error: 'Nombre es requerido' }
  if (email && !EMAIL_REGEX.test(email)) return { error: 'Email del proveedor inválido' }

  const { error } = await supabase.from('proveedores').insert({
    nombre,
    contacto,
    email,
    whatsapp,
    url_tienda: urlTienda,
    notas,
    activo: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  return { ok: true }
}

export async function actualizarProveedor(
  id: string,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const contacto = formData.get('contacto')?.toString().trim() || null
  const email = formData.get('email')?.toString().trim() || null
  const whatsapp = formData.get('whatsapp')?.toString().trim() || null
  const urlTienda = formData.get('url_tienda')?.toString().trim() || null
  const notas = formData.get('notas')?.toString().trim() || null

  if (!nombre) return { error: 'Nombre es requerido' }
  if (email && !EMAIL_REGEX.test(email)) return { error: 'Email del proveedor inválido' }

  const { error } = await supabase
    .from('proveedores')
    .update({ nombre, contacto, email, whatsapp, url_tienda: urlTienda, notas })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  return { ok: true }
}

export async function eliminarProveedor(id: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { count } = await supabase
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq('proveedor_id', id)
    .eq('activo', true)

  if ((count ?? 0) > 0) {
    return { error: 'Tiene productos activos asociados.' }
  }

  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// CMS — Banners del Hero
// ---------------------------------------------------------------------------

export interface BannerHeroInput {
  titulo: string
  subtitulo?: string | null
  tag?: string | null
  imagen_url: string
  cta_label: string
  cta_href: string
  cta_secundario_label?: string | null
  cta_secundario_href?: string | null
  align: 'left' | 'center'
  orden?: number
  activo?: boolean
}

export async function crearBannerHero(
  data: BannerHeroInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { supabase } = await verificarAdmin()

  if (!data.titulo?.trim()) return { ok: false, error: 'Título requerido' }
  if (!data.imagen_url?.trim()) return { ok: false, error: 'Imagen requerida' }

  const { data: row, error } = await supabase
    .from('tienda_banners')
    .insert({
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || null,
      tag: data.tag?.trim() || null,
      imagen_url: data.imagen_url.trim(),
      cta_label: data.cta_label?.trim() || 'Ver catálogo',
      cta_href: data.cta_href?.trim() || '/productos',
      cta_secundario_label: data.cta_secundario_label?.trim() || null,
      cta_secundario_href: data.cta_secundario_href?.trim() || null,
      align: data.align,
      orden: data.orden ?? 0,
      activo: data.activo !== false,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/apariencia')
  return { ok: true, id: row?.id }
}

export async function actualizarBannerHero(
  id: string,
  data: Partial<BannerHeroInput>
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const patch: Record<string, unknown> = {}
  if (data.titulo !== undefined)               patch.titulo               = data.titulo.trim()
  if (data.subtitulo !== undefined)            patch.subtitulo            = data.subtitulo?.trim() || null
  if (data.tag !== undefined)                  patch.tag                  = data.tag?.trim() || null
  if (data.imagen_url !== undefined)           patch.imagen_url           = data.imagen_url.trim()
  if (data.cta_label !== undefined)            patch.cta_label            = data.cta_label.trim()
  if (data.cta_href !== undefined)             patch.cta_href             = data.cta_href.trim()
  if (data.cta_secundario_label !== undefined) patch.cta_secundario_label = data.cta_secundario_label?.trim() || null
  if (data.cta_secundario_href !== undefined)  patch.cta_secundario_href  = data.cta_secundario_href?.trim() || null
  if (data.align !== undefined)                patch.align                = data.align
  if (data.orden !== undefined)                patch.orden                = data.orden
  if (data.activo !== undefined)               patch.activo               = data.activo

  const { error } = await supabase.from('tienda_banners').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/apariencia')
  return { ok: true }
}

export async function eliminarBannerHero(id: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()
  const { error } = await supabase.from('tienda_banners').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/admin/apariencia')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// CMS — Configuración del Promo Banner (singleton)
// ---------------------------------------------------------------------------

export interface ConfiguracionTiendaInput {
  promo_tag: string
  promo_titulo: string
  promo_descripcion?: string | null
  promo_descuento: string
  promo_cta_label: string
  promo_cta_href: string
  promo_imagen?: string | null
}

export async function actualizarConfiguracionTienda(
  data: ConfiguracionTiendaInput
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { error } = await supabase
    .from('tienda_configuracion')
    .upsert({
      id: true,
      promo_tag:         data.promo_tag.trim()          || 'Colección exclusiva',
      promo_titulo:      data.promo_titulo.trim()       || 'Oferta especial',
      promo_descripcion: data.promo_descripcion?.trim() || null,
      promo_descuento:   data.promo_descuento.trim()    || '20% OFF',
      promo_cta_label:   data.promo_cta_label.trim()    || 'Comprar ahora',
      promo_cta_href:    data.promo_cta_href.trim()     || '/productos',
      promo_imagen:      data.promo_imagen?.trim()      || null,
      updated_at:        new Date().toISOString(),
    })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/apariencia')
  return { ok: true }
}
