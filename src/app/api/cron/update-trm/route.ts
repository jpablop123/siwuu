import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron diario: trae la TRM oficial (Superfinanciera vía datos.gov.co),
// la guarda en tienda_configuracion y recalcula los precios en COP de los
// productos que tienen precio_usd. Lo dispara Vercel Cron (ver vercel.json).
//
// Seguridad: Vercel agrega `Authorization: Bearer ${CRON_SECRET}` cuando la
// variable CRON_SECRET está definida. Bloqueamos cualquier otra llamada.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TRM_ENDPOINT =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1'

async function fetchTRMOficial(): Promise<number | null> {
  try {
    const res = await fetch(TRM_ENDPOINT, {
      headers: { 'User-Agent': 'SiwuuShop/1.0' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ valor?: string }>
    const valor = Number(data?.[0]?.valor)
    return Number.isFinite(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  // Autorización del cron
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const trm = await fetchTRMOficial()
  if (trm === null) {
    return NextResponse.json(
      { ok: false, error: 'No se pudo obtener la TRM oficial' },
      { status: 502 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error: upErr } = await supabase
    .from('config_trm')
    .update({ trm, trm_updated_at: new Date().toISOString() })
    .eq('id', true)
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
  }

  const { data: n, error: rpcErr } = await supabase.rpc('recalcular_precios')
  if (rpcErr) {
    return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, trm, productosActualizados: n })
}
