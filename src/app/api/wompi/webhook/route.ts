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
  const integritySecret = process.env.WOMPI_EVENTS_SECRET
  if (!integritySecret) {
    console.error('Webhook: WOMPI_EVENTS_SECRET no configurado')
    return new Response('Internal Server Error', { status: 500 })
  }

  const checksum = request.headers.get('x-event-checksum')
  if (!checksum) return new Response('Unauthorized', { status: 401 })

  const hashEsperado = await sha256(bodyTexto + integritySecret)
  if (checksum !== hashEsperado) {
    console.error('Webhook: firma inválida')
    return new Response('Unauthorized', { status: 401 })
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
    // Paso 5 — UPDATE atómico en pagos (idempotencia absoluta)
    //
    // La cláusula `.eq('estado', 'pendiente')` garantiza que
    // solo UNA petición concurrente puede modificar el registro.
    // PostgreSQL toma un row-level lock durante el UPDATE.
    // La segunda petición simultánea encontrará estado='aprobado'
    // y recibirá data=[] → aborta silenciosamente.
    // ───────────────────────────────────────────────────────────
    const { data: pagosActualizados, error: pagoError } = await supabase
      .from('pagos')
      .update({
        estado: 'aprobado',
        wompi_transaction_id: transactionId,
      })
      .eq('wompi_referencia', referencia)
      .eq('estado', 'pendiente')          // ← barrera atómica
      .select('id, pedido_id')

    if (pagoError) {
      console.error('Webhook: error actualizando pago:', pagoError.message)
      return new Response('ok', { status: 200 })
    }

    // Sin filas → ya fue procesado (Wompi reintentó). Abortar.
    if (!pagosActualizados || pagosActualizados.length === 0) {
      return new Response('ok', { status: 200 })
    }

    const { pedido_id: pedidoId } = pagosActualizados[0]

    // ───────────────────────────────────────────────────────────
    // Paso 6 — UPDATE atómico en pedidos
    //
    // Segunda barrera: solo actualiza si aún está en 'pendiente'.
    // Protege contra el caso extremadamente raro de doble-webhook
    // simultáneo que pase ambas barreras.
    // ───────────────────────────────────────────────────────────
    const { data: pedidosActualizados, error: pedidoError } = await supabase
      .from('pedidos')
      .update({
        estado: 'pago_confirmado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .neq('estado', 'pago_confirmado')   // ← segunda barrera atómica
      .select('id')

    if (pedidoError) {
      console.error('Webhook: error actualizando pedido:', pedidoError.message)
      return new Response('ok', { status: 200 })
    }

    // Si el pedido ya estaba confirmado, igual retornar 200
    if (!pedidosActualizados || pedidosActualizados.length === 0) {
      return new Response('ok', { status: 200 })
    }

    // ───────────────────────────────────────────────────────────
    // Paso 7 — Email de confirmación (best-effort)
    // El fallo queda registrado en logs_notificaciones.
    // ───────────────────────────────────────────────────────────
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
      .eq('id', pedidoId)
      .single()

    if (pedidoCompleto) {
      const items = (pedidoCompleto.pedido_items as Array<{
        nombre_producto: string
        variante: string | null
        cantidad: number
        precio_unitario: number
      }>)
      await enviarEmailConfirmacionPedido({
        pedidoId,
        email:          pedidoCompleto.email_cliente,
        nombre:         pedidoCompleto.nombre_cliente,
        numeroPedido:   pedidoCompleto.numero,
        items:          items.map((i) => ({
          nombre:          i.nombre_producto,
          variante:        i.variante,
          cantidad:        i.cantidad,
          precioUnitario:  i.precio_unitario,
        })),
        subtotal:       pedidoCompleto.subtotal,
        costoEnvio:     pedidoCompleto.costo_envio,
        total:          pedidoCompleto.total,
        ciudad:         pedidoCompleto.ciudad,
        departamento:   pedidoCompleto.departamento,
        direccionEnvio: pedidoCompleto.direccion_envio,
      })
    }
  } catch (error) {
    console.error('Webhook: error no manejado:', error)
  }

  // ───────────────────────────────────────────────────────────
  // Paso 8 — Siempre retornar 200
  // Wompi marca el webhook como fallido si no recibe 200.
  // ───────────────────────────────────────────────────────────
  return new Response('ok', { status: 200 })
}
