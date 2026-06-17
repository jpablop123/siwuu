// Carga el catálogo Apple (iPhones + Macs) como personal shopper:
//   - Crea categorías Celulares + Computadores
//   - Inserta/actualiza 12 productos con precio_usd (fuente de verdad)
//   - Descarga las imágenes oficiales y las sube al bucket productos_imagenes
//   - Llama recalcular_precios() para fijar los precios COP desde la TRM
//
// Requiere que la migración 023 ya esté aplicada (columna precio_usd + config).
// Correr:  node --env-file=.env.local scripts/seed-apple-catalog.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const BUCKET = 'productos_imagenes'

const CATEGORIAS = [
  { nombre: 'Celulares', slug: 'celulares', descripcion: 'iPhones nuevos traídos desde USA', activa: true, orden: 60 },
  { nombre: 'Computadores', slug: 'computadores', descripcion: 'Mac: portátiles y de escritorio desde USA', activa: true, orden: 70 },
]

const IMG = (id, extra = '') =>
  `https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${id}?wid=1200&fmt=jpeg&qlt=95${extra}`

// slug, nombre, cat, usd, destacado, desc_corta, imagen
const PRODUCTOS = [
  ['iphone-17e', 'iPhone 17e', 'celulares', 599, false, 'Chip A19, pantalla Super Retina XDR de 6.1", cámara Fusion de 48MP — el iPhone más accesible.', IMG('iphone-17e-finish-unselect-gallery-1-202603_GEO_US')],
  ['iphone-17', 'iPhone 17', 'celulares', 799, true, 'Chip A19, pantalla de 6.3" con ProMotion 120Hz y cámaras Fusion de 48MP — el equilibrio perfecto.', IMG('iphone-17-finish-unselect-gallery-1-202509_GEO_US')],
  ['iphone-air', 'iPhone Air', 'celulares', 999, true, 'Chip A19 Pro, pantalla de 6.5" y solo 5,6 mm — el iPhone más delgado jamás creado.', IMG('iphone-air-finish-unselect-gallery-1-202509')],
  ['iphone-17-pro', 'iPhone 17 Pro', 'celulares', 1099, false, 'Chip A19 Pro, pantalla de 6.3" con ProMotion, triple cámara de 48MP y zoom óptico 8x.', IMG('iphone-17-pro-model-unselect-gallery-1-202509')],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 'celulares', 1199, true, 'Chip A19 Pro, pantalla de 6.9" con ProMotion, triple cámara de 48MP y zoom óptico 8x — el más potente.', IMG('iphone-17-pro-model-unselect-gallery-1-202509')],
  ['macbook-air-13-m5', 'MacBook Air 13" (M5)', 'computadores', 1099, true, 'Chip M5, pantalla Liquid Retina de 13.6" y hasta 18h de batería. Ultraligera.', IMG('macbook-air-size-unselect-202601-gallery-1')],
  ['macbook-air-15-m5', 'MacBook Air 15" (M5)', 'computadores', 1299, false, 'Chip M5, pantalla Liquid Retina de 15.3" y hasta 18h de batería. Más pantalla, mismo peso pluma.', IMG('macbook-air-size-unselect-202601-gallery-1')],
  ['macbook-pro-14-m5', 'MacBook Pro 14" (M5)', 'computadores', 1699, true, 'Chip M5 (opción M5 Pro/Max), pantalla Liquid Retina XDR de 14" y hasta 24h de batería.', IMG('mac-macbook-pro-size-unselect-202601-gallery-1')],
  ['macbook-pro-16-m5-pro', 'MacBook Pro 16" (M5 Pro)', 'computadores', 2699, false, 'Chip M5 Pro (opción M5 Max), pantalla Liquid Retina XDR de 16" — potencia profesional.', IMG('mac-macbook-pro-size-unselect-202601-gallery-1')],
  ['imac-m4', 'iMac (M4)', 'computadores', 1299, false, 'Chip M4, pantalla Retina 4.5K de 24", todo en uno con cámara Center Stage.', IMG('imac-color-unselect-202601-gallery-1')],
  ['mac-mini-m4', 'Mac mini (M4)', 'computadores', 799, false, 'Chip M4 (opción M4 Pro), diseño compacto de 12,7 cm con Thunderbolt y Apple Intelligence.', IMG('mac-mini-chip-unselect-202601-gallery-1')],
  ['mac-studio-m4-max', 'Mac Studio (M4 Max)', 'computadores', 1999, false, 'Chip M4 Max (opción M3 Ultra), Thunderbolt 5 — potencia de escritorio profesional.', IMG('mac-studio-chip-unselect-202601-gallery-1')],
]

// Tasa inicial (la migración trae trm=3427.07 + spread=100, margen=15).
// recalcular_precios() la dejará idéntica; esto solo satisface NOT NULL al insertar.
const TASA = 3427.07 + 100
const MARGEN = 0.15
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

async function main() {
  // 1. Categorías
  const { error: catErr } = await supabase
    .from('categorias')
    .upsert(CATEGORIAS, { onConflict: 'slug' })
  if (catErr) throw new Error(`categorias: ${catErr.message}`)
  const { data: cats } = await supabase.from('categorias').select('id,slug')
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

  // 2. Upsert productos con precio_usd
  const rows = PRODUCTOS.map(([slug, nombre, cat, usd, destacado, desc]) => {
    const venta = Math.round(usd * TASA * (1 + MARGEN))
    return {
      slug,
      nombre,
      categoria_id: catId[cat],
      descripcion_corta: desc,
      precio_usd: usd,
      precio_costo: Math.round(usd * TASA),
      precio_venta: venta,
      precio_tachado: Math.round(venta * 1.2),
      destacado,
      activo: true,
      stock_virtual: 10,
    }
  })
  const { error: upErr } = await supabase
    .from('productos')
    .upsert(rows, { onConflict: 'slug' })
  if (upErr) throw new Error(`productos: ${upErr.message}`)
  console.log(`✓ ${rows.length} productos insertados/actualizados`)

  // 3. Imágenes
  for (const [slug, nombre, , , , , img] of PRODUCTOS) {
    try {
      const res = await fetch(img, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok) throw new Error(`descarga HTTP ${res.status}`)
      let ct = (res.headers.get('content-type') || '').split(';')[0].trim()
      if (!EXT[ct]) ct = 'image/jpeg'
      const buf = Buffer.from(await res.arrayBuffer())
      const path = `seed/${slug}.${EXT[ct]}`
      const { error: sErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: ct, upsert: true })
      if (sErr) throw new Error(`upload: ${sErr.message}`)
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const { error: dErr } = await supabase
        .from('productos')
        .update({ imagenes: [pub.publicUrl] })
        .eq('slug', slug)
      if (dErr) throw new Error(`db: ${dErr.message}`)
      console.log(`  ✓ img ${slug.padEnd(24)} ${Math.round(buf.length / 1024)}KB`)
    } catch (e) {
      console.log(`  ✗ img ${slug.padEnd(24)} ${e.message}`)
    }
  }

  // 4. Recalcular precios desde la TRM
  const { data: n, error: rpcErr } = await supabase.rpc('recalcular_precios')
  if (rpcErr) throw new Error(`recalcular_precios: ${rpcErr.message}`)
  console.log(`✓ recalcular_precios(): ${n} productos con precio actualizado desde la TRM`)
}

main().catch((e) => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
