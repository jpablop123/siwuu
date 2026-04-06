import { createClient, createServiceClient } from '@/lib/supabase/server'
import { procesarPedido, type PedidoItemInput } from '@/lib/services/pedidos.service'
import { rlCheckout } from '@/lib/ratelimit'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (configured && !configured.includes('localhost')) return configured
  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

/**
 * Route Handler — flujo de checkout con widget embebido de Wompi.
 * Thin wrapper sobre procesarPedido().
 */
export async function POST(request: Request) {
  try {
    const rl = await rlCheckout(request)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intentá de nuevo en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const body = await request.json() as {
      nombre: string
      email: string
      telefono: string
      departamento: string
      ciudad: string
      direccion: string
      barrio?: string
      indicaciones?: string
      // Solo extraemos productoId/cantidad/variante — precio siempre desde BD
      items: Array<{ productoId: string; cantidad: number; variante?: string; [k: string]: unknown }>
    }

    // ── Autenticación: Authorization header → fallback a cookies ──────
    const serviceClient = createServiceClient()
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await serviceClient.auth.getUser(authHeader.slice(7))
      userId = data.user?.id ?? null
    } else {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    }

    // ── Strip de campos inseguros del frontend (nunca confiar en precio) ─
    const items: PedidoItemInput[] = body.items.map((i) => ({
      productoId: i.productoId,
      cantidad:   i.cantidad,
      variante:   i.variante,
    }))

    const result = await procesarPedido({
      nombre:       body.nombre,
      email:        body.email,
      telefono:     body.telefono,
      departamento: body.departamento,
      ciudad:       body.ciudad,
      direccion:    body.direccion,
      barrio:       body.barrio ?? null,
      indicaciones: body.indicaciones ?? null,
      items,
      userId,
      appUrl: getAppUrl(request),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // ── Cookie para pedidos de invitados ──────────────────────────────
    if (!userId) {
      const cookieStore = cookies()
      cookieStore.set(`guest_pedido_${result.pedidoId}`, result.tokenAcceso, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 7,
      })
    }

    return NextResponse.json({
      pedidoId:        result.pedidoId,
      referencia:      result.referencia,
      montoEnCentavos: result.montoEnCentavos,
      integrityHash:   result.integrityHash,
      redirectUrl:     result.redirectUrl,
    })
  } catch (error) {
    console.error('[POST /api/checkout]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
