import { NextResponse } from 'next/server'
import { rlExchangeRate } from '@/lib/ratelimit'

// Cache en memoria del servidor — se renueva cada 24h o al reiniciar
let cached: { rate: number; effectiveRate: number; fetchedAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

// Margen a favor: el cliente ve un dólar más caro (tú ganas la diferencia).
// NUNCA se expone en la respuesta — es un detalle de negocio privado.
const MARGIN_PERCENT = Number(process.env.USD_MARGIN_PERCENT ?? '3')

async function fetchRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 86400 } }
    )
    if (res.ok) {
      const data = await res.json()
      const copPerUsd = data.rates?.COP
      if (copPerUsd && typeof copPerUsd === 'number') return copPerUsd
    }
  } catch {
    // Fallback silencioso
  }

  // Fallback: tasa fija razonable
  return 4200
}

export async function GET(request: Request) {
  const rl = await rlExchangeRate(request)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const now = Date.now()

  if (cached && now - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json({
      effectiveRate: cached.effectiveRate,
      cachedAt: new Date(cached.fetchedAt).toISOString(),
    })
  }

  const realRate = await fetchRate()
  const effectiveRate = Math.round(realRate * (1 + MARGIN_PERCENT / 100))

  cached = { rate: realRate, effectiveRate, fetchedAt: now }

  return NextResponse.json({
    effectiveRate,
    cachedAt: new Date(now).toISOString(),
  })
}
