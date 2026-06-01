import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rlAuth } from '@/lib/ratelimit'

/**
 * POST /api/cupones/validar
 *
 * Body: { codigo: string, subtotal: number }
 * Resp 200: { valido: boolean, descuento: number, mensaje?: string, codigo?: string }
 *
 * Devuelve preview del cupón (sin reservarlo). El descuento real lo
 * recalcula y consume `procesar_checkout_atomico` cuando se crea la orden.
 *
 * Compartimos rate limiter con auth para abaratar setup (10/5min): suficiente
 * para probar 2-3 códigos legítimos, no para fuerza bruta.
 */
export async function POST(request: Request) {
  try {
    const rl = await rlAuth(request.headers)
    if (!rl.ok) {
      return NextResponse.json(
        { valido: false, mensaje: 'Demasiados intentos. Esperá unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const body = await request.json() as { codigo?: unknown; subtotal?: unknown }
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0

    if (!codigo || codigo.length > 30) {
      return NextResponse.json({ valido: false, mensaje: 'Código inválido' })
    }
    if (subtotal <= 0) {
      return NextResponse.json({ valido: false, mensaje: 'Carrito vacío' })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('validar_cupon', {
      p_codigo:   codigo,
      p_subtotal: subtotal,
    })

    if (error || !data || data.length === 0) {
      return NextResponse.json({ valido: false, mensaje: 'Código inválido' })
    }

    const row = data[0]
    if (row.error) {
      return NextResponse.json({
        valido: false,
        mensaje: row.error,
        descuento: Number(row.descuento ?? 0),
      })
    }

    return NextResponse.json({
      valido:    true,
      codigo:    row.codigo,
      descuento: Number(row.descuento ?? 0),
    })
  } catch (err) {
    console.error('[POST /api/cupones/validar]', err)
    return NextResponse.json({ valido: false, mensaje: 'Error interno' }, { status: 500 })
  }
}
