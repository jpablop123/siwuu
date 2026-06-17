// Pre-carga recargos (precio_adicional) por almacenamiento, estilo Apple,
// convertidos a COP con la tasa efectiva (TRM + spread). Editable luego en admin.
// Correr: node --env-file=.env.local scripts/recargos-almacenamiento.mjs
import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Recargo en USD sobre el almacenamiento base de cada modelo
const USD = {
  'iphone-17e':            { '128 GB': 0, '256 GB': 100, '512 GB': 300 },
  'iphone-17':             { '256 GB': 0, '512 GB': 200 },
  'iphone-air':            { '256 GB': 0, '512 GB': 200, '1 TB': 400 },
  'iphone-17-pro':         { '256 GB': 0, '512 GB': 200, '1 TB': 400, '2 TB': 600 },
  'iphone-17-pro-max':     { '256 GB': 0, '512 GB': 200, '1 TB': 400, '2 TB': 600 },
  'macbook-air-13-m5':     { '256 GB': 0, '512 GB': 200, '1 TB': 400, '2 TB': 800 },
  'macbook-air-15-m5':     { '256 GB': 0, '512 GB': 200, '1 TB': 400, '2 TB': 800 },
  'macbook-pro-14-m5':     { '512 GB': 0, '1 TB': 200, '2 TB': 600 },
  'macbook-pro-16-m5-pro': { '512 GB': 0, '1 TB': 200, '2 TB': 600 },
  'imac-m4':               { '256 GB': 0, '512 GB': 200, '1 TB': 400 },
  'mac-mini-m4':           { '256 GB': 0, '512 GB': 200, '1 TB': 400 },
  'mac-studio-m4-max':     { '512 GB': 0, '1 TB': 200, '2 TB': 600 },
}

async function main() {
  const { data: trm } = await s.from('config_trm').select('trm, trm_spread').maybeSingle()
  const tasa = Number(trm.trm) + Number(trm.trm_spread)
  console.log(`Tasa efectiva: $${tasa.toLocaleString('es-CO')} por USD\n`)

  const { data: prods } = await s.from('productos').select('id, slug')
  const id = Object.fromEntries(prods.map((p) => [p.slug, p.id]))

  let total = 0
  for (const [slug, tiers] of Object.entries(USD)) {
    const pid = id[slug]
    if (!pid) { console.log(`! no existe: ${slug}`); continue }
    for (const [valor, usd] of Object.entries(tiers)) {
      // redondear a 10.000 COP para precios limpios
      const cop = Math.round((usd * tasa) / 10000) * 10000
      const { error } = await s.from('variantes')
        .update({ precio_adicional: cop })
        .eq('producto_id', pid).eq('nombre', 'Almacenamiento').eq('valor', valor)
      if (error) { console.log(`✗ ${slug} ${valor}: ${error.message}`); continue }
      if (usd > 0) total++
    }
    const resumen = Object.entries(tiers)
      .map(([v, u]) => `${v}:${u ? '+$' + (Math.round(u * tasa / 10000) * 10000).toLocaleString('es-CO') : 'base'}`)
      .join('  ')
    console.log(`✓ ${slug.padEnd(24)} ${resumen}`)
  }
  console.log(`\nListo. ${total} recargos aplicados.`)
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
