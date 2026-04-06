/**
 * Tests de idempotencia del webhook de Wompi.
 *
 * Verifica que:
 * 1. Un evento APPROVED procesa el pago exactamente una vez.
 * 2. Un segundo evento APPROVED con la misma referencia retorna 200
 *    sin re-procesar (el UPDATE atómico no encuentra filas pendientes).
 * 3. Eventos no-APPROVED son ignorados silenciosamente.
 * 4. Checksum inválido es rechazado con 401.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { POST } from './route'

// ── Mocks de módulos ──────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/wompi/client', () => ({
  sha256: vi.fn(),
}))

vi.mock('@/lib/resend/emails', () => ({
  enviarEmailConfirmacionPedido: vi.fn().mockResolvedValue({ ok: true }),
}))

// ── Importar los mocks para poder configurarlos ───────────────────────────────

import { createServiceClient } from '@/lib/supabase/server'
import { sha256 } from '@/lib/wompi/client'
import { enviarEmailConfirmacionPedido } from '@/lib/resend/emails'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FIXED_CHECKSUM = 'abc123checksum'
const PEDIDO_ID = '550e8400-e29b-41d4-a716-446655440000'
const PAGO_ID = 'pago-uuid-001'

const WOMPI_PAYLOAD = {
  event: 'transaction.updated',
  data: {
    transaction: {
      id: 'wompi-tx-001',
      status: 'APPROVED',
      reference: `DRSHP-550e8400-1711234567890`,
      amount_in_cents: 15000000,
      payment_method_type: 'CARD',
    },
  },
  timestamp: 1711234567,
}

const PEDIDO_COMPLETO = {
  numero: 'PED-00001',
  nombre_cliente: 'Ana García',
  email_cliente: 'ana@example.com',
  subtotal: 140000,
  costo_envio: 10000,
  total: 150000,
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  direccion_envio: 'Calle 123 #45-67',
  pedido_items: [
    { nombre_producto: 'Camiseta', variante: 'L', cantidad: 1, precio_unitario: 140000 },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Construye un mock fluido para el cliente de Supabase.
 * Acepta un mapa de resultados por tabla para `.select()`.
 */
function makeSupabaseMock(options: {
  pagosUpdateResult: { data: Array<{ id: string; pedido_id: string }> | null; error: null | { message: string } }
  pedidosUpdateResult?: { data: Array<{ id: string }> | null; error: null }
  pedidosSelectResult?: { data: typeof PEDIDO_COMPLETO | null; error: null }
}) {
  // Cadena fluida: from → update/select/eq/neq/single → resolución
  const makeChain = (resolvedValue: unknown) => {
    const chain: Record<string, unknown> = {}
    for (const method of ['update', 'eq', 'neq', 'insert']) {
      chain[method] = vi.fn().mockReturnValue(chain)
    }
    chain.select = vi.fn().mockResolvedValue(resolvedValue)
    chain.single  = vi.fn().mockResolvedValue(
      options.pedidosSelectResult ?? { data: PEDIDO_COMPLETO, error: null }
    )
    return chain
  }

  const fromMock = vi.fn((tabla: string) => {
    if (tabla === 'pagos')   return makeChain(options.pagosUpdateResult)
    if (tabla === 'pedidos') {
      // En el webhook se hace: update().eq().neq().select() → pedidosUpdateResult
      //                    y:  select(…).eq(id).single()    → pedidosSelectResult
      // Devolvemos una cadena que maneja ambos casos
      const chain = makeChain(options.pedidosUpdateResult ?? { data: [{ id: PEDIDO_ID }], error: null })
      // Sobreescribir single para el SELECT de detalle
      chain.single = vi.fn().mockResolvedValue(
        options.pedidosSelectResult ?? { data: PEDIDO_COMPLETO, error: null }
      )
      return chain
    }
    // Tabla desconocida — retornar cadena neutra
    return makeChain({ data: null, error: null })
  })

  return { from: fromMock }
}

/** Construye un Request firmado con el checksum mockeado. */
function makeRequest(body: object, checksum = FIXED_CHECKSUM): Request {
  return new Request('http://localhost/api/wompi/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-event-checksum': checksum,
    },
    body: JSON.stringify(body),
  })
}

// ── Setup global ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // sha256 siempre devuelve el checksum fijo → la verificación de firma pasa
  ;(sha256 as Mock).mockResolvedValue(FIXED_CHECKSUM)
  // Variable de entorno requerida por el webhook
  process.env.WOMPI_EVENTS_SECRET = 'test-secret'
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/wompi/webhook — idempotencia', () => {
  it('procesa el pago en la primera llamada y envía el email de confirmación', async () => {
    ;(createServiceClient as Mock).mockReturnValue(
      makeSupabaseMock({
        pagosUpdateResult:   { data: [{ id: PAGO_ID, pedido_id: PEDIDO_ID }], error: null },
        pedidosUpdateResult: { data: [{ id: PEDIDO_ID }], error: null },
        pedidosSelectResult: { data: PEDIDO_COMPLETO, error: null },
      })
    )

    const response = await POST(makeRequest(WOMPI_PAYLOAD))

    expect(response.status).toBe(200)
    expect(enviarEmailConfirmacionPedido).toHaveBeenCalledOnce()
    expect(enviarEmailConfirmacionPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        pedidoId: PEDIDO_ID,
        email:    PEDIDO_COMPLETO.email_cliente,
        total:    PEDIDO_COMPLETO.total,
      })
    )
  })

  it('retorna 200 sin re-procesar en la segunda llamada (UPDATE no encuentra filas pendientes)', async () => {
    // Segunda llamada: pagos ya tiene estado='aprobado' → UPDATE devuelve []
    ;(createServiceClient as Mock).mockReturnValue(
      makeSupabaseMock({
        pagosUpdateResult: { data: [], error: null },
      })
    )

    const response = await POST(makeRequest(WOMPI_PAYLOAD))

    expect(response.status).toBe(200)
    // No debe enviar email ni actualizar pedidos
    expect(enviarEmailConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('garantiza idempotencia: dos llamadas simultáneas solo procesan una vez', async () => {
    let llamadas = 0

    // Primera llamada encuentra fila pendiente; segunda llega tarde y encuentra vacío
    ;(createServiceClient as Mock).mockImplementation(() => {
      llamadas++
      const esSegunda = llamadas > 1
      return makeSupabaseMock({
        pagosUpdateResult: esSegunda
          ? { data: [], error: null }
          : { data: [{ id: PAGO_ID, pedido_id: PEDIDO_ID }], error: null },
        pedidosUpdateResult: { data: [{ id: PEDIDO_ID }], error: null },
      })
    })

    const [res1, res2] = await Promise.all([
      POST(makeRequest(WOMPI_PAYLOAD)),
      POST(makeRequest(WOMPI_PAYLOAD)),
    ])

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    // Solo una llamada procesó el pedido
    expect(enviarEmailConfirmacionPedido).toHaveBeenCalledOnce()
  })
})

describe('POST /api/wompi/webhook — validación de firma', () => {
  it('rechaza el webhook con checksum inválido (401)', async () => {
    // sha256 devuelve un hash diferente al del header
    ;(sha256 as Mock).mockResolvedValue('hash-completamente-diferente')

    const response = await POST(makeRequest(WOMPI_PAYLOAD, 'checksum-incorrecto'))

    expect(response.status).toBe(401)
    expect(enviarEmailConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('rechaza si falta el header x-event-checksum (401)', async () => {
    const request = new Request('http://localhost/api/wompi/webhook', {
      method: 'POST',
      body: JSON.stringify(WOMPI_PAYLOAD),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/wompi/webhook — eventos no relevantes', () => {
  it('ignora eventos que no son transaction.updated', async () => {
    ;(createServiceClient as Mock).mockReturnValue(
      makeSupabaseMock({ pagosUpdateResult: { data: [], error: null } })
    )

    const payload = { ...WOMPI_PAYLOAD, event: 'transaction.created' }
    const response = await POST(makeRequest(payload))

    expect(response.status).toBe(200)
    expect(enviarEmailConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('ignora transacciones con status != APPROVED', async () => {
    ;(createServiceClient as Mock).mockReturnValue(
      makeSupabaseMock({ pagosUpdateResult: { data: [], error: null } })
    )

    const payload = {
      ...WOMPI_PAYLOAD,
      data: {
        transaction: { ...WOMPI_PAYLOAD.data.transaction, status: 'DECLINED' },
      },
    }
    const response = await POST(makeRequest(payload))

    expect(response.status).toBe(200)
    expect(enviarEmailConfirmacionPedido).not.toHaveBeenCalled()
  })
})
