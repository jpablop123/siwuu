// Reorganiza el catálogo en categorías claras y elimina el duplicado.
// Correr: node --env-file=.env.local scripts/reorganizar-categorias.mjs
import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const CATEGORIAS = [
  { nombre: 'Celulares', slug: 'celulares', descripcion: 'iPhones nuevos traídos desde USA', activa: true, orden: 10 },
  { nombre: 'Computadores', slug: 'computadores', descripcion: 'Mac: portátiles y de escritorio desde USA', activa: true, orden: 20 },
  { nombre: 'Audio', slug: 'audio', descripcion: 'Audífonos y parlantes', activa: true, orden: 30 },
  { nombre: 'Cargadores y cables', slug: 'cargadores-y-cables', descripcion: 'Adaptadores, cables y cargadores de auto', activa: true, orden: 40 },
  { nombre: 'Power banks', slug: 'power-banks', descripcion: 'Baterías portátiles y cargadores inalámbricos', activa: true, orden: 50 },
]

// slug del producto -> slug de la categoría destino
const ASIGNAR = {
  audio: ['apple-earpods-usb-c', 'apple-earpods-lightning', 'parlante-bluetooth-prodigee-mag-da-beat-con-magsafe---plateado'],
  'cargadores-y-cables': ['apple-home-power-adapter-20w-usb-c', 'apple-usb-c-to-usb-c-woven-cable-1m', 'apple-cable-type-c-to-lightning', 'samsung-travel-charger-45w', 'samsung-travel-charger-25w-black', 'samsung-travel-charger-25w-white', 'prodigee-energee-mini-car-charger'],
  'power-banks': ['prodigee-mag-power-to-go-10k-cream', 'prodigee-mag-power-to-go-10k-metallic'],
}

async function main() {
  // 1. Upsert categorías (crea las nuevas, actualiza orden de las existentes)
  const { error: ce } = await s.from('categorias').upsert(CATEGORIAS, { onConflict: 'slug' })
  if (ce) throw new Error('categorias: ' + ce.message)
  const { data: cats } = await s.from('categorias').select('id,slug')
  const id = Object.fromEntries(cats.map((c) => [c.slug, c.id]))
  console.log('✓ Categorías listas')

  // 2. Reasignar productos
  for (const [catSlug, slugs] of Object.entries(ASIGNAR)) {
    const { error } = await s.from('productos').update({ categoria_id: id[catSlug] }).in('slug', slugs)
    if (error) throw new Error(`reasignar ${catSlug}: ${error.message}`)
    console.log(`✓ ${slugs.length} -> ${catSlug}`)
  }

  // 3. Eliminar el duplicado sin pedidos; renombrar el que se conserva
  const dupSlug = 'prodigee-mag-da-beat-silver'
  const { error: delErr } = await s.from('productos').delete().eq('slug', dupSlug)
  if (delErr) {
    console.log(`! No se pudo borrar ${dupSlug} (${delErr.message}) -> lo desactivo`)
    await s.from('productos').update({ activo: false, categoria_id: id['audio'] }).eq('slug', dupSlug)
  } else {
    console.log(`✓ Duplicado eliminado: ${dupSlug}`)
  }
  await s.from('productos')
    .update({ nombre: 'Parlante Bluetooth Prodigee Mag Da Beat (Plateado)' })
    .eq('slug', 'parlante-bluetooth-prodigee-mag-da-beat-con-magsafe---plateado')
  console.log('✓ Nombre del parlante normalizado')

  // 4. Borrar la categoría vieja vacía
  const { count: rest } = await s.from('productos').select('*', { count: 'exact', head: true }).eq('categoria_id', id['accesorios-para-celular'])
  if (id['accesorios-para-celular'] && rest === 0) {
    const { error } = await s.from('categorias').delete().eq('slug', 'accesorios-para-celular')
    console.log(error ? `! No se pudo borrar categoría vieja: ${error.message}` : '✓ Categoría vieja "Accesorios para celular" eliminada')
  } else {
    console.log(`! Categoría vieja aún tiene ${rest} productos, no la borro`)
  }

  // 5. Resumen
  const { data: cats2 } = await s.from('categorias').select('id,nombre,slug').order('orden')
  const { data: prods } = await s.from('productos').select('categoria_id,activo')
  console.log('\n== RESULTADO ==')
  for (const c of cats2) {
    const n = prods.filter((p) => p.categoria_id === c.id && p.activo).length
    console.log(`  ${c.nombre}: ${n}`)
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
