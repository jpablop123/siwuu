import { NextResponse } from 'next/server'

// Cache en memoria del servidor — se renueva cada 24h o al reiniciar
let cached: { rate: number; fetchedAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

// Margen a favor: el cliente ve un dólar más caro (tú ganas la diferencia)
// Ej: si el dólar real es $4,200 y el margen es 3%, el cliente ve $4,326
const MARGIN_PERCENT = Number(process.env.USD_MARGIN_PERCENT ?? '3')

async function fetchRate(): Promise<number> {
  // Intentar ExchangeRate-API (gratis, sin API key)
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

export async function GET() {
  const now = Date.now()

  if (cached && now - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json({
      rate: cached.rate,
      margin: MARGIN_PERCENT,
      effectiveRate: Math.round(cached.rate * (1 + MARGIN_PERCENT / 100)),
      cachedAt: new Date(cached.fetchedAt).toISOString(),
    })
  }

  const realRate = await fetchRate()
  const effectiveRate = Math.round(realRate * (1 + MARGIN_PERCENT / 100))

  cached = { rate: effectiveRate, fetchedAt: now }

  return NextResponse.json({
    rate: realRate,
    margin: MARGIN_PERCENT,
    effectiveRate,
    cachedAt: new Date(now).toISOString(),
  })
}
