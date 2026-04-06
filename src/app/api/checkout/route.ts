import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generarReferencia, generarHashIntegridad } from '@/lib/wompi/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface CheckoutItem {
  productoId: string
  nombre: string
  imagen: string
  variante?: string
  cantidad: number
  precioUnitario: number
}

function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (configured && !configured.includes('localhost')) return configured
  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre, email, telefono, departamento, ciudad, direccion,
      items, subtotal, costoEnvio, total,
    } = body as {
      nombre: string
      email: string
      telefono: string
      departamento: string
      ciudad: string
      direccion: string
      items: CheckoutItem[]
      subtotal: number
      costoEnvio: number
      total: number
    }

    const supabase = createClient()
    const serviceClient = createServiceClient()

    // 1. Paralelo: número de pedido + auth
    const [{ data: numPedido }, { data: { user } }] = await Promise.all([
      serviceClient.rpc('generar_numero_pedido'),
      supabase.auth.getUser(),
    ])
    const numero = (numPedido as string) || `PED-${Date.now()}`

    // 2. Crear pedido
    const { data: pedido, error: pedidoError } = await serviceClient
      .from('pedidos')
      .insert({
        numero,
        user_id: user?.id || null,
        email_cliente: email,
        nombre_cliente: nombre,
        telefono_cliente: telefono,
        ciudad,
        departamento,
        direccion_envio: direccion,
        subtotal,
        costo_envio: costoEnvio,
        total,
      })
      .select()
      .single()

    if (pedidoError || !pedido) {
      return NextResponse.json({ error: 'Error creando pedido' }, { status: 500 })
    }

    const referencia = generarReferencia(pedido.id)
    const montoEnCentavos = Math.round(total * 100)
    const redirectUrl = `${getAppUrl(request)}/checkout/gracias/${pedido.id}`

    const pedidoItems = items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.productoId,
      nombre_producto: item.nombre,
      imagen_producto: item.imagen,
      variante: item.variante || null,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      subtotal: item.precioUnitario * item.cantidad,
    }))

    // 3. Decrementar stock atómicamente (falla con 409 si no hay stock)
    for (const item of items) {
      const { error: stockError } = await serviceClient.rpc('decrementar_stock', {
        p_producto_id: item.productoId,
        p_cantidad: item.cantidad,
      })
      if (stockError) {
        // Limpiar pedido creado antes de fallar
        await serviceClient.from('pedidos').delete().eq('id', pedido.id)
        const sinStock = stockError.message?.includes('insuficiente')
        return NextResponse.json(
          { error: sinStock ? `Sin stock suficiente para "${item.nombre}"` : 'Error verificando stock' },
          { status: sinStock ? 409 : 500 }
        )
      }
    }

    // 4. Paralelo: items + pago + hash de integridad
    const [, , integrityHash] = await Promise.all([
      serviceClient.from('pedido_items').insert(pedidoItems),
      serviceClient.from('pagos').insert({
        pedido_id: pedido.id,
        monto: total,
        wompi_referencia: referencia,
      }),
      generarHashIntegridad(
        referencia,
        montoEnCentavos,
        'COP',
        process.env.WOMPI_INTEGRITY_SECRET!,
        redirectUrl
      ),
    ])

    // Si es compra como invitado, guardar pedido en cookie httpOnly para que pueda
    // ver la página de confirmación sin estar autenticado
    if (!user?.id) {
      const cookieStore = cookies()
      cookieStore.set(`guest_pedido_${pedido.id}`, '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })
    }

    // Devolver params para el widget embebido (no la URL completa)
    return NextResponse.json({
      pedidoId: pedido.id,
      referencia,
      montoEnCentavos,
      integrityHash,
      redirectUrl,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
