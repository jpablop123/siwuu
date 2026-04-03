import { createClient } from '@/lib/supabase/server'
import { generarReferencia, construirURLCheckout } from '@/lib/wompi/client'
import { NextResponse } from 'next/server'

interface CheckoutItem {
  productoId: string
  nombre: string
  imagen: string
  variante?: string
  cantidad: number
  precioUnitario: number
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

    // 1. Paralelo: número de pedido + auth
    const [{ data: numPedido }, { data: { user } }] = await Promise.all([
      supabase.rpc('generar_numero_pedido'),
      supabase.auth.getUser(),
    ])
    const numero = (numPedido as string) || `PED-${Date.now()}`

    // 2. Crear pedido (depende de paso 1)
    const { data: pedido, error: pedidoError } = await supabase
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

    // 3. Paralelo: items + pago + URL de Wompi
    const referencia = generarReferencia(pedido.id)
    const montoEnCentavos = Math.round(total * 100)

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

    const [, , checkoutUrl] = await Promise.all([
      supabase.from('pedido_items').insert(pedidoItems),
      supabase.from('pagos').insert({
        pedido_id: pedido.id,
        monto: total,
        wompi_referencia: referencia,
      }),
      construirURLCheckout({
        referencia,
        montoEnCentavos,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/gracias/${pedido.id}`,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
        integritySecret: process.env.WOMPI_INTEGRITY_SECRET!,
      }),
    ])

    return NextResponse.json({ checkoutUrl, pedidoId: pedido.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
