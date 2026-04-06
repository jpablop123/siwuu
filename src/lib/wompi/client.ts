/**
 * Cliente de Wompi para procesamiento de pagos.
 *
 * Usa la Web Crypto API (SubtleCrypto) en lugar de Node.js `crypto`,
 * lo que lo hace compatible con Edge Runtime, Vercel Serverless y browsers.
 *
 * Documentación de Wompi: https://docs.wompi.co/
 */

import type { WompiTransaction } from '@/types'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const WOMPI_SANDBOX_URL = 'https://sandbox.wompi.co/v1'
const WOMPI_PRODUCTION_URL = 'https://production.wompi.co/v1'
const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/'

type WompiEnvironment = 'sandbox' | 'production'

function getBaseUrl(env: WompiEnvironment = 'sandbox'): string {
  return env === 'production' ? WOMPI_PRODUCTION_URL : WOMPI_SANDBOX_URL
}

// ---------------------------------------------------------------------------
// SHA-256 con Web Crypto API (Edge-compatible)
// ---------------------------------------------------------------------------

export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Generar referencia única
// ---------------------------------------------------------------------------

/**
 * Genera una referencia de pago única para Wompi.
 * Formato: DRSHP-{primeros 8 chars del pedidoId}-{timestamp}
 *
 * @example generarReferencia("550e8400-e29b") → "DRSHP-550e8400-1711234567890"
 */
export function generarReferencia(pedidoId: string): string {
  const timestamp = Date.now()
  const shortId = pedidoId.replace(/-/g, '').slice(0, 8)
  return `DRSHP-${shortId}-${timestamp}`
}

// ---------------------------------------------------------------------------
// Hash de integridad
// ---------------------------------------------------------------------------

/**
 * Genera el hash de integridad SHA-256 requerido por Wompi para
 * garantizar que los parámetros del pago no fueron manipulados.
 *
 * La cadena se construye concatenando: referencia + montoEnCentavos + moneda + secreto
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/#firmas-de-integridad
 */
export async function generarHashIntegridad(
  referencia: string,
  montoEnCentavos: number,
  moneda: string,
  secreto: string
): Promise<string> {
  const cadena = `${referencia}${montoEnCentavos}${moneda}${secreto}`
  return sha256(cadena)
}

// ---------------------------------------------------------------------------
// Construir URL de checkout
// ---------------------------------------------------------------------------

interface CheckoutParams {
  referencia: string
  montoEnCentavos: number
  moneda?: string
  redirectUrl: string
  publicKey: string
  integritySecret: string
}

/**
 * Construye la URL completa para redirigir al widget de checkout de Wompi.
 * El usuario es redirigido a esta URL para completar el pago.
 */
export async function construirURLCheckout(params: CheckoutParams): Promise<string> {
  const {
    referencia,
    montoEnCentavos,
    moneda = 'COP',
    redirectUrl,
    publicKey,
    integritySecret,
  } = params

  const hash = await generarHashIntegridad(referencia, montoEnCentavos, moneda, integritySecret)

  // Construir manualmente para preservar "signature:integrity" sin codificar el ":"
  const qs = [
    `public-key=${encodeURIComponent(publicKey)}`,
    `currency=${moneda}`,
    `amount-in-cents=${montoEnCentavos}`,
    `reference=${encodeURIComponent(referencia)}`,
    `redirect-url=${encodeURIComponent(redirectUrl)}`,
    `signature:integrity=${hash}`,
  ].join('&')

  return `${WOMPI_CHECKOUT_URL}?${qs}`
}

// ---------------------------------------------------------------------------
// Verificar transacción
// ---------------------------------------------------------------------------

interface WompiTransactionListResponse {
  data: WompiTransaction[]
}

/**
 * Consulta el estado de una transacción en Wompi por su referencia.
 * Usa la API REST de Wompi con la llave privada (server-side only).
 *
 * @returns La transacción encontrada o null si no existe
 */
export async function verificarTransaccion(
  referencia: string,
  env: WompiEnvironment = 'sandbox'
): Promise<WompiTransaction | null> {
  const baseUrl = getBaseUrl(env)

  const response = await fetch(
    `${baseUrl}/transactions?reference=${encodeURIComponent(referencia)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      },
      // No cachear — siempre consultar el estado actual
      cache: 'no-store',
    }
  )

  if (!response.ok) return null

  const body: WompiTransactionListResponse = await response.json()
  return body.data?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Verificar firma del webhook
// ---------------------------------------------------------------------------

/**
 * Valida que un request POST entrante de Wompi es legítimo
 * comparando la firma HMAC del payload.
 *
 * Wompi envía:
 * - Header `x-event-checksum`: SHA-256 de la concatenación de propiedades del evento
 *
 * Según la documentación de Wompi, el checksum se calcula como:
 * SHA256(transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret)
 *
 * @returns true si la firma es válida
 */
export async function verificarFirmaWebhook(
  transactionId: string,
  status: string,
  amountInCents: number,
  timestamp: string,
  receivedChecksum: string,
  secret: string
): Promise<boolean> {
  const cadena = `${transactionId}${status}${amountInCents}${timestamp}${secret}`
  const expectedChecksum = await sha256(cadena)

  // Comparación de longitud constante para prevenir timing attacks
  if (expectedChecksum.length !== receivedChecksum.length) return false

  let mismatch = 0
  for (let i = 0; i < expectedChecksum.length; i++) {
    mismatch |= expectedChecksum.charCodeAt(i) ^ receivedChecksum.charCodeAt(i)
  }

  return mismatch === 0
}
