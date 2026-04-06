/**
 * Rate limiting centralizado con Upstash Redis + @upstash/ratelimit.
 *
 * Degradación suave: si UPSTASH_REDIS_REST_URL / _TOKEN no están
 * definidas (dev sin Redis), todas las funciones retornan { ok: true }.
 *
 * Variables de entorno requeridas en producción:
 *   UPSTASH_REDIS_REST_URL=https://...
 *   UPSTASH_REDIS_REST_TOKEN=...
 *
 * Setup en Vercel:
 *   1. Crear DB en console.upstash.com (free tier: 10k req/día)
 *   2. Copiar REST URL y Token → Settings → Environment Variables
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Redis client (singleton) ───────────────────────────────────────────────

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// ── Limiters ───────────────────────────────────────────────────────────────

/**
 * /api/checkout — 5 requests por IP cada 10 minutos.
 * Previene bombing de inventario y stock exhaustion attacks.
 */
const checkoutLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '10 m'), prefix: 'rl:checkout' })
  : null

/**
 * /api/auth/check-email — 30 requests por IP por minuto.
 * Previene enumeración de emails registrados.
 */
const emailCheckLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:emailcheck' })
  : null

/**
 * Auth actions (login, registro, recuperar) — 10 intentos por IP cada 5 minutos.
 * Previene fuerza bruta sobre credenciales.
 */
const authLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '5 m'), prefix: 'rl:auth' })
  : null

// ── Tipos y helpers internos ──────────────────────────────────────────────

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

function extractIp(source: Request | Headers): string {
  const h = source instanceof Request ? source.headers : source
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    '127.0.0.1'
  )
}

async function applyLimit(
  limiter: Ratelimit | null,
  id: string
): Promise<RateLimitResult> {
  if (!limiter) return { ok: true }
  const { success, reset } = await limiter.limit(id)
  if (success) return { ok: true }
  return { ok: false, retryAfter: Math.ceil((reset - Date.now()) / 1000) }
}

// ── API pública ────────────────────────────────────────────────────────────

/** Usar en /api/checkout */
export async function rlCheckout(request: Request): Promise<RateLimitResult> {
  return applyLimit(checkoutLimiter, extractIp(request))
}

/** Usar en /api/auth/check-email */
export async function rlEmailCheck(request: Request): Promise<RateLimitResult> {
  return applyLimit(emailCheckLimiter, extractIp(request))
}

/**
 * Usar en Server Actions de auth.
 * Recibe `headers()` de next/headers (disponible en Server Actions).
 */
export async function rlAuth(requestHeaders: Headers): Promise<RateLimitResult> {
  return applyLimit(authLimiter, extractIp(requestHeaders))
}
