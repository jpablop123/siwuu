import { createServiceClient } from '@/lib/supabase/server'
import { sha256 } from '@/lib/wompi/client'
import { enviarEmailConfirmacionPedido } from '@/lib/resend/emails'

interface WompiEvento {
  event: string
  data: {
    transaction: {
      id: string
      status: string
      reference: string
      amount_in_cents: number
      payment_method_type: string
    }
  }
  timestamp: number
}

export async function POST(request: Request) {
  // ───────────────────────────────────────────────────────────
  // Paso 1 — Leer body como texto (antes de parsear)
  // ───────────────────────────────────────────────────────────
  const bodyTexto = await request.text()

  // ───────────────────────────────────────────────────────────
  // Paso 2 — Verificar firma ANTES de parsear
  // ───────────────────────────────────────────────────────────
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET
  if (integritySecret) {
    const checksum = request.headers.get('x-event-checksum')
    if (!checksum) {
      return new Response('Unauthorized', { status: 401 })
    }
    const hashEsperado = await sha256(bodyTexto + integritySecret)
    if (checksum !== hashEsperado) {
      console.error('Webhook: firma inválida')
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // ───────────────────────────────────────────────────────────
  // Paso 3 — Parsear body
  // ───────────────────────────────────────────────────────────
  let evento: WompiEvento
  try {
    evento = JSON.parse(bodyTexto)
  } catch {
    return new Response('ok', { status: 200 })
  }

  // ───────────────────────────────────────────────────────────
  // Paso 4 — Procesar solo si es pago aprobado
  // ───────────────────────────────────────────────────────────
  if (
    evento.event !== 'transaction.updated' ||
    evento.data?.transaction?.status !== 'APPROVED'
  ) {
    return new Response('ok', { status: 200 })
  }

  const { id: transactionId, reference: referencia } = evento.data.transaction
  const supabase = createServiceClient()

  try {
    // ───────────────────────────────────────────────────────────
    // Paso 5 — Chequeo de idempotencia
    // ───────────────────────────────────────────────────────────
    const { data: pagoExistente } = await supabase
      .from('pagos')
      .select('id, pedido_id, pedido:pedidos(estado)')
      .eq('wompi_referencia', referencia)
      .single()

    if (!pagoExistente) {
      console.error('Webhook: pago no encontrado para referencia', referencia)
      return new Response('ok', { status: 200 })
    }

    const pedidoJoin = pagoExistente.pedido as unknown as { estado: string } | null
    if (pedidoJoin?.estado === 'pago_confirmado') {
      // Ya fue procesado antes (Wompi reintentó). Abortar silenciosamente.
      return new Response('ok', { status: 200 })
    }

    // ───────────────────────────────────────────────────────────
    // Paso 6 — Actualizar pago y pedido
    // ───────────────────────────────────────────────────────────
    await supabase
      .from('pagos')
      .update({
        estado: 'aprobado',
        wompi_transaction_id: transactionId,
      })
      .eq('id', pagoExistente.id)

    await supabase
      .from('pedidos')
      .update({
        estado: 'pago_confirmado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pagoExistente.pedido_id)

    // ───────────────────────────────────────────────────────────
    // Paso 7 — Email de confirmación (best-effort)
    // ───────────────────────────────────────────────────────────
    try {
      const { data: pedidoCompleto } = await supabase
        .from('pedidos')
        .select(`
          numero, nombre_cliente, email_cliente,
          subtotal, costo_envio, total,
          ciudad, departamento, direccion_envio,
          pedido_items (
            nombre_producto, variante,
            cantidad, precio_unitario
          )
        `)
        .eq('id', pagoExistente.pedido_id)
        .single()

      if (pedidoCompleto) {
        const items = (pedidoCompleto.pedido_items as Array<{
          nombre_producto: string
          variante: string | null
          cantidad: number
          precio_unitario: number
        }>)
        await enviarEmailConfirmacionPedido({
          email: pedidoCompleto.email_cliente,
          nombre: pedidoCompleto.nombre_cliente,
          numeroPedido: pedidoCompleto.numero,
          items: items.map((i) => ({
            nombre: i.nombre_producto,
            variante: i.variante,
            cantidad: i.cantidad,
            precioUnitario: i.precio_unitario,
          })),
          subtotal: pedidoCompleto.subtotal,
          costoEnvio: pedidoCompleto.costo_envio,
          total: pedidoCompleto.total,
          ciudad: pedidoCompleto.ciudad,
          departamento: pedidoCompleto.departamento,
          direccionEnvio: pedidoCompleto.direccion_envio,
        })
      }
    } catch (emailError) {
      // BEST-EFFORT: loguear pero NO fallar el webhook
      console.error('Error enviando email de confirmación:', emailError)
    }
  } catch (error) {
    console.error('Webhook: error procesando evento', error)
  }

  // ───────────────────────────────────────────────────────────
  // Paso 8 — Siempre retornar 200
  // Wompi marca el webhook como fallido si no recibe 200.
  // ───────────────────────────────────────────────────────────
  return new Response('ok', { status: 200 })
}
