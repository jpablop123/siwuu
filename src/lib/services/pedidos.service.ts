/**
 * Servicio unificado de creación de pedidos.
 *
 * Punto de entrada único para toda la lógica de negocio del checkout:
 * - Validación de inputs
 * - Recálculo de precios desde BD (nunca confiar en el frontend)
 * - Checkout atómico vía RPC: INSERT pedido + stock + items + pago en
 *   una sola transacción SQL (migración 012). PostgreSQL hace ROLLBACK
 *   automático si algo falla — eliminamos el rollback manual en TypeScript.
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
  tokenAcceso: string
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
    productosDB.map((p) => [p.id, { nombre: p.nombre, precio: p.precio_venta, imagen: p.imagenes?.[0] ?? '' }])
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

  // ── 3. UUID y referencia Wompi — se calculan antes del RPC para poder
  //       pasarlos al checkout atómico en un solo viaje a la BD ────────
  const pedidoId = crypto.randomUUID()
  const referencia = generarReferencia(pedidoId)
  const redirectUrl = `${appUrl}/checkout/gracias/${pedidoId}`

  // ── 4. Serializar items para el RPC ───────────────────────────────
  const itemsJson = items.map((item) => {
    const p = productosMap.get(item.productoId)!
    return {
      producto_id:     item.productoId,
      nombre_producto: p.nombre,
      imagen_producto: p.imagen || null,
      variante:        item.variante ?? null,
      cantidad:        item.cantidad,
      precio_unitario: p.precio,
      subtotal:        p.precio * item.cantidad,
    }
  })

  // ── 5. Checkout atómico — INSERT pedido + stock + items + pago ────
  //       Un único viaje a PostgreSQL. Si decrementar_stock() lanza
  //       RAISE EXCEPTION (sin stock), el ROLLBACK es automático.
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'procesar_checkout_atomico',
    {
      p_pedido_id:    pedidoId,
      p_numero:       numero,
      p_user_id:      userId,
      p_email:        email,
      p_nombre:       nombre,
      p_telefono:     telefono,
      p_ciudad:       ciudad,
      p_departamento: departamento,
      p_direccion:    direccion,
      p_subtotal:     subtotal,
      p_costo_envio:  costoEnvio,
      p_total:        total,
      p_items:        itemsJson,
      p_referencia:   referencia,
    }
  )

  if (rpcError || !rpcData || rpcData.length === 0) {
    console.error('[procesarPedido] Error en checkout atómico:', rpcError)
    // El mensaje de PG tiene formato: 'Stock insuficiente para el producto: Camiseta Roja'
    // Lo propagamos directamente para que el frontend pueda mostrarlo al usuario.
    const sinStock = rpcError?.message?.includes('Stock insuficiente para el producto:')
    if (sinStock) {
      return { ok: false, error: rpcError!.message, status: 409 }
    }
    return { ok: false, error: 'Error al procesar el pedido', status: 500 }
  }

  const tokenAcceso = rpcData[0].token_acceso

  // ── 6. Hash de integridad Wompi ────────────────────────────────────
  const integrityHash = await generarHashIntegridad(
    referencia,
    montoEnCentavos,
    'COP',
    process.env.WOMPI_INTEGRITY_SECRET!
  )

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

  return { ok: true, pedidoId, tokenAcceso, referencia, montoEnCentavos, redirectUrl, integrityHash }
}
