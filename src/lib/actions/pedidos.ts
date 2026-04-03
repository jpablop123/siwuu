'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { construirURLCheckout } from '@/lib/wompi/client'
import { calcularEnvio } from '@/lib/utils'

interface ItemInput {
  productoId: string
  cantidad: number
  variante?: string
}

type CrearPedidoResult =
  | { ok: true; pedidoId: string; urlPago: string }
  | { ok: false; error: string }

export async function crearPedido(formData: FormData): Promise<CrearPedidoResult> {
  // ───────────────────────────────────────────────────────────
  // Paso 1 — Extraer y validar campos del formData
  // ───────────────────────────────────────────────────────────
  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim() ?? ''
  const telefono = formData.get('telefono')?.toString().trim() ?? ''
  const ciudad = formData.get('ciudad')?.toString().trim() ?? ''
  const departamento = formData.get('departamento')?.toString().trim() ?? ''
  const direccion = formData.get('direccion')?.toString().trim() ?? ''
  const barrio = formData.get('barrio')?.toString().trim() || null
  const indicaciones = formData.get('indicaciones')?.toString().trim() || null
  const guardarDireccion = formData.get('guardar_direccion') === 'true'

  let items: ItemInput[]
  try {
    const itemsRaw = formData.get('items')?.toString()
    items = itemsRaw ? JSON.parse(itemsRaw) : []
  } catch {
    return { ok: false, error: 'Campos incompletos' }
  }

  if (!nombre || !email || !telefono || !ciudad || !departamento || !direccion || items.length === 0) {
    return { ok: false, error: 'Campos incompletos' }
  }

  // Validar que cada item tiene productoId y cantidad válida
  for (const item of items) {
    if (!item.productoId || !item.cantidad || item.cantidad < 1) {
      return { ok: false, error: 'Campos incompletos' }
    }
  }

  try {
    const supabase = createServiceClient()

    // ───────────────────────────────────────────────────────────
    // Paso 2 — RECALCULAR PRECIOS EN EL SERVIDOR
    // Nunca confiar en precios del frontend
    // ───────────────────────────────────────────────────────────
    const productoIds = [...new Set(items.map((i) => i.productoId))]

    const { data: productosDB, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, precio_venta, imagenes')
      .in('id', productoIds)
      .eq('activo', true)

    if (productosError || !productosDB) {
      return { ok: false, error: 'Error al verificar productos' }
    }

    // Verificar que todos los productos existen y están activos
    if (productosDB.length !== productoIds.length) {
      return { ok: false, error: 'Producto no disponible' }
    }

    const productosMap = new Map(
      productosDB.map((p: { id: string; nombre: string; precio_venta: number; imagenes: string[] }) => [
        p.id,
        { nombre: p.nombre, precio: p.precio_venta, imagen: p.imagenes?.[0] || '' },
      ])
    )

    // Calcular subtotal desde la base de datos
    let subtotal = 0
    for (const item of items) {
      const producto = productosMap.get(item.productoId)
      if (!producto) {
        return { ok: false, error: 'Producto no disponible' }
      }
      subtotal += producto.precio * item.cantidad
    }

    const costoEnvio = calcularEnvio(subtotal)
    const total = subtotal + costoEnvio

    // ───────────────────────────────────────────────────────────
    // Paso 3 — Generar número de pedido
    // ───────────────────────────────────────────────────────────
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })

    const numero = `PED-${String((count ?? 0) + 1).padStart(5, '0')}`

    // ───────────────────────────────────────────────────────────
    // Paso 4 — Obtener usuario autenticado (si aplica)
    // ───────────────────────────────────────────────────────────
    const supabaseAuth = createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    // ───────────────────────────────────────────────────────────
    // Paso 5 — INSERT pedido con valores calculados en el servidor
    // ───────────────────────────────────────────────────────────
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        numero,
        user_id: user?.id ?? null,
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
      console.error('Error creando pedido:', pedidoError)
      return { ok: false, error: 'Error al procesar el pedido' }
    }

    const pedidoId: string = pedido.id

    // ───────────────────────────────────────────────────────────
    // Paso 6 — INSERT bulk pedido_items con precios del servidor
    // ───────────────────────────────────────────────────────────
    const pedidoItems = items.map((item) => {
      const producto = productosMap.get(item.productoId)!
      return {
        pedido_id: pedidoId,
        producto_id: item.productoId,
        nombre_producto: producto.nombre,
        imagen_producto: producto.imagen,
        variante: item.variante || null,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
        subtotal: producto.precio * item.cantidad,
      }
    })

    const { error: itemsError } = await supabase
      .from('pedido_items')
      .insert(pedidoItems)

    if (itemsError) {
      console.error('Error creando items:', itemsError)
      return { ok: false, error: 'Error al procesar el pedido' }
    }

    // ───────────────────────────────────────────────────────────
    // Paso 7 — Generar referencia Wompi
    // ───────────────────────────────────────────────────────────
    const referencia = `ORD-${pedidoId.slice(0, 8)}-${Date.now()}`

    // ───────────────────────────────────────────────────────────
    // Paso 8 — Calcular monto en centavos
    // ───────────────────────────────────────────────────────────
    const montoCentavos = Math.round(total * 100)

    // ───────────────────────────────────────────────────────────
    // Paso 9 — INSERT pago
    // ───────────────────────────────────────────────────────────
    const { error: pagoError } = await supabase.from('pagos').insert({
      pedido_id: pedidoId,
      monto: total,
      wompi_referencia: referencia,
      estado: 'pendiente',
    })

    if (pagoError) {
      console.error('Error creando pago:', pagoError)
      return { ok: false, error: 'Error al procesar el pedido' }
    }

    // ───────────────────────────────────────────────────────────
    // Paso 10 — Guardar dirección si el usuario lo pidió
    // ───────────────────────────────────────────────────────────
    if (user && guardarDireccion) {
      await supabase.from('direcciones').insert({
        user_id: user.id,
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

    // ───────────────────────────────────────────────────────────
    // Paso 11 — Construir URL de pago Wompi
    // ───────────────────────────────────────────────────────────
    const urlPago = await construirURLCheckout({
      referencia,
      montoEnCentavos: montoCentavos,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/gracias/${pedidoId}`,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
      integritySecret: process.env.WOMPI_INTEGRITY_SECRET!,
    })

    // ───────────────────────────────────────────────────────────
    // Paso 12 — Retornar éxito
    // ───────────────────────────────────────────────────────────
    return { ok: true, pedidoId, urlPago }
  } catch (error) {
    console.error('Error en crearPedido:', error)
    return { ok: false, error: 'Error al procesar el pedido' }
  }
}
