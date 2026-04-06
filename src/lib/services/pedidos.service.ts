/**
 * Servicio unificado de creación de pedidos.
 *
 * Punto de entrada único para toda la lógica de negocio del checkout:
 * - Validación de inputs
 * - Recálculo de precios desde BD (nunca confiar en el frontend)
 * - Decremento atómico de stock
 * - Inserción de pedido, items y registro de pago
 * - Generación de referencia e hash de integridad Wompi
 *
 * Consumidores:
 *   - src/lib/actions/pedidos.ts  (Server Action → flujo redirect)
 *   - src/app/api/checkout/route.ts (Route Handler → widget embebido)
 */

import { createServiceClient } from '@/lib/supabase/server'
import { generarReferencia, generarHashIntegridad } from '@/lib/wompi/client'
import { calcularEnvio } from '@/lib/utils'

// ────────────────────────────────────────────────────────────
// Tipos públicos
// ────────────────────────────────────────────────────────────

export interface PedidoItemInput {
  productoId: string
  cantidad: number
  variante?: string
}

export interface PedidoInput {
  nombre: string
  email: string
  telefono: string
  departamento: string
  ciudad: string
  direccion: string
  barrio?: string | null
  indicaciones?: string | null
  guardarDireccion?: boolean
  items: PedidoItemInput[]
  /** ID del usuario autenticado; null si es invitado */
  userId?: string | null
  /** Base URL de la app (para construir redirectUrl de Wompi) */
  appUrl: string
}

export interface PedidoCreado {
  pedidoId: string
  referencia: string
  montoEnCentavos: number
  redirectUrl: string
  integrityHash: string
}

export type PedidoResult =
  | ({ ok: true } & PedidoCreado)
  | { ok: false; error: string; status: number }

// ────────────────────────────────────────────────────────────
// Validaciones
// ────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^[+]?[\d\s\-().]{7,15}$/

function validarInput(
  input: PedidoInput
): { ok: false; error: string; status: number } | null {
  const { nombre, email, telefono, departamento, ciudad, direccion, items } = input

  if (!nombre || !email || !telefono || !departamento || !ciudad || !direccion || items.length === 0) {
    return { ok: false, error: 'Campos incompletos', status: 400 }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Email inválido', status: 400 }
  }
  if (!TELEFONO_REGEX.test(telefono)) {
    return { ok: false, error: 'Teléfono inválido', status: 400 }
  }
  for (const item of items) {
    if (!item.productoId || !item.cantidad || item.cantidad < 1) {
      return { ok: false, error: 'Items inválidos', status: 400 }
    }
  }
  return null
}

// ────────────────────────────────────────────────────────────
// Servicio principal
// ────────────────────────────────────────────────────────────

export async function procesarPedido(input: PedidoInput): Promise<PedidoResult> {
  const validationError = validarInput(input)
  if (validationError) return validationError

  const {
    nombre, email, telefono, departamento, ciudad, direccion,
    barrio = null, indicaciones = null, guardarDireccion = false,
    items, userId = null, appUrl,
  } = input

  const supabase = createServiceClient()

  // ── 1. Recalcular precios desde BD (nunca confiar en el frontend) ──
  const productoIds = [...new Set(items.map((i) => i.productoId))]

  const { data: productosDB, error: productosError } = await supabase
    .from('productos')
    .select('id, nombre, precio_venta, imagenes')
    .in('id', productoIds)
    .eq('activo', true)

  if (productosError || !productosDB) {
    return { ok: false, error: 'Error al verificar productos', status: 500 }
  }
  if (productosDB.length !== productoIds.length) {
    return { ok: false, error: 'Uno o más productos no están disponibles', status: 422 }
  }

  const productosMap = new Map(
    (productosDB as Array<{ id: string; nombre: string; precio_venta: number; imagenes: string[] }>)
      .map((p) => [p.id, { nombre: p.nombre, precio: p.precio_venta, imagen: p.imagenes?.[0] ?? '' }])
  )

  let subtotal = 0
  for (const item of items) {
    const p = productosMap.get(item.productoId)
    if (!p) return { ok: false, error: 'Producto no disponible', status: 422 }
    subtotal += p.precio * item.cantidad
  }

  const costoEnvio = calcularEnvio(subtotal)
  const total = subtotal + costoEnvio
  const montoEnCentavos = Math.round(total * 100)

  // ── 2. Número de pedido (SEQUENCE atómica — sin COUNT(*)) ──────────
  const { data: numPedido } = await supabase.rpc('generar_numero_pedido')
  const numero = (numPedido as string) ?? `PED-${Date.now()}`

  // ── 3. INSERT pedido ───────────────────────────────────────────────
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      numero,
      user_id: userId ?? null,
      email_cliente: email,
      nombre_cliente: nombre,
      telefono_cliente: telefono,
      ciudad,
      departamento,
      direccion_envio: direccion,
      subtotal,
      costo_envio: costoEnvio,
      total,
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (pedidoError || !pedido) {
    console.error('[procesarPedido] Error creando pedido:', pedidoError)
    return { ok: false, error: 'Error al procesar el pedido', status: 500 }
  }

  const pedidoId: string = (pedido as { id: string }).id

  // ── 4. Decrementar stock (FOR UPDATE en PG — sin race conditions) ──
  for (const item of items) {
    const { error: stockError } = await supabase.rpc('decrementar_stock', {
      p_producto_id: item.productoId,
      p_cantidad: item.cantidad,
    })
    if (stockError) {
      // Rollback del pedido ya creado
      await supabase.from('pedidos').delete().eq('id', pedidoId)
      const sinStock = stockError.message?.includes('insuficiente')
      return {
        ok: false,
        error: sinStock
          ? `Sin stock suficiente para "${productosMap.get(item.productoId)?.nombre}"`
          : 'Error verificando stock',
        status: sinStock ? 409 : 500,
      }
    }
  }

  // ── 5. INSERT pedido_items ─────────────────────────────────────────
  const pedidoItems = items.map((item) => {
    const p = productosMap.get(item.productoId)!
    return {
      pedido_id: pedidoId,
      producto_id: item.productoId,
      nombre_producto: p.nombre,
      imagen_producto: p.imagen,
      variante: item.variante ?? null,
      cantidad: item.cantidad,
      precio_unitario: p.precio,
      subtotal: p.precio * item.cantidad,
    }
  })

  const { error: itemsError } = await supabase.from('pedido_items').insert(pedidoItems)
  if (itemsError) {
    console.error('[procesarPedido] Error creando items:', itemsError)
    await supabase.from('pedidos').delete().eq('id', pedidoId)
    return { ok: false, error: 'Error al procesar el pedido', status: 500 }
  }

  // ── 6. Referencia + hash Wompi + registro de pago (paralelo) ──────
  const referencia = generarReferencia(pedidoId)
  const redirectUrl = `${appUrl}/checkout/gracias/${pedidoId}`

  const [, integrityHash] = await Promise.all([
    supabase.from('pagos').insert({
      pedido_id: pedidoId,
      monto: total,
      wompi_referencia: referencia,
      estado: 'pendiente',
    }),
    generarHashIntegridad(
      referencia,
      montoEnCentavos,
      'COP',
      process.env.WOMPI_INTEGRITY_SECRET!
    ),
  ])

  // ── 7. Guardar dirección (opcional, no bloquea el flujo) ───────────
  if (userId && guardarDireccion) {
    await supabase.from('direcciones').insert({
      user_id: userId,
      nombre_destinatario: nombre,
      telefono,
      ciudad,
      departamento,
      direccion,
      barrio,
      indicaciones,
      principal: false,
    })
  }

  return { ok: true, pedidoId, referencia, montoEnCentavos, redirectUrl, integrityHash }
}
