// Agrega configuraciones de Chip y Memoria RAM a los Macs (variantes), con
// recargos estilo Apple convertidos a COP. Idempotente por dimensión.
// Correr: node --env-file=.env.local scripts/configs-mac.mjs
import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// slug -> { dimensión: { valor: recargoUSD } }  (el primer valor = base, +0)
const CONFIG = {
  'macbook-air-13-m5':     { 'Memoria RAM': { '16 GB': 0, '24 GB': 200, '32 GB': 400 } },
  'macbook-air-15-m5':     { 'Memoria RAM': { '16 GB': 0, '24 GB': 200, '32 GB': 400 } },
  'macbook-pro-14-m5':     { 'Chip': { 'M5': 0, 'M5 Pro': 300, 'M5 Max': 700 }, 'Memoria RAM': { '16 GB': 0, '24 GB': 200, '32 GB': 400, '48 GB': 800 } },
  'macbook-pro-16-m5-pro': { 'Chip': { 'M5 Pro': 0, 'M5 Max': 400 }, 'Memoria RAM': { '24 GB': 0, '48 GB': 400, '64 GB': 800 } },
  'imac-m4':               { 'Memoria RAM': { '16 GB': 0, '24 GB': 200, '32 GB': 400 } },
  'mac-mini-m4':           { 'Chip': { 'M4': 0, 'M4 Pro': 400 }, 'Memoria RAM': { '16 GB': 0, '24 GB': 200, '32 GB': 400 } },
  'mac-studio-m4-max':     { 'Chip': { 'M4 Max': 0, 'M3 Ultra': 1500 }, 'Memoria RAM': { '36 GB': 0, '48 GB': 300, '64 GB': 600, '128 GB': 1500 } },
}

async function main() {
  const { data: trm } = await s.from('config_trm').select('trm, trm_spread').maybeSingle()
  const tasa = Number(trm.trm) + Number(trm.trm_spread)
  const cop = (usd) => Math.round((usd * tasa) / 10000) * 10000

  const { data: prods } = await s.from('productos').select('id, slug')
  const id = Object.fromEntries(prods.map((p) => [p.slug, p.id]))

  for (const [slug, dims] of Object.entries(CONFIG)) {
    const pid = id[slug]
    if (!pid) { console.log(`! no existe: ${slug}`); continue }
    const partes = []
    for (const [nombre, tiers] of Object.entries(dims)) {
      // idempotente: borrar esa dimensión y recrearla
      await s.from('variantes').delete().eq('producto_id', pid).eq('nombre', nombre)
      const filas = Object.entries(tiers).map(([valor, usd]) => ({
        producto_id: pid, nombre, valor, precio_adicional: cop(usd), disponible: true,
      }))
      const { error } = await s.from('variantes').insert(filas)
      if (error) { console.log(`✗ ${slug} ${nombre}: ${error.message}`); continue }
      partes.push(`${nombre}(${filas.length})`)
    }
    console.log(`✓ ${slug.padEnd(24)} ${partes.join('  ')}`)
  }
  console.log('\nListo.')
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
