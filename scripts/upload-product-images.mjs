// Descarga las imágenes oficiales de cada producto, las sube al bucket
// `productos_imagenes` de Supabase y actualiza productos.imagenes con la URL
// pública. Idempotente: upsert en storage + update por slug.
//
// Correr:  node --env-file=.env.local scripts/upload-product-images.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const BUCKET = 'productos_imagenes'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// Apple: usamos solo `wid` (sin hei=630) para evitar el recorte social y traer
// la foto de producto completa en fondo blanco, a mayor resolución.
const apple = (id) =>
  `https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${id}?wid=1600&fmt=jpeg&qlt=95`

const PRODUCTOS = [
  ['apple-home-power-adapter-20w-usb-c', apple('MWVV3')],
  ['apple-earpods-usb-c', apple('MTJY3')],
  ['apple-earpods-lightning', apple('MMTN2')],
  ['apple-usb-c-to-usb-c-woven-cable-1m', apple('MQKJ3')],
  ['apple-cable-type-c-to-lightning', apple('MM0A3')],
  ['samsung-travel-charger-45w', 'https://images.samsung.com/is/image/samsung/p6pim/hk_en/ep-t4510xbeggb/gallery/hk-en-45w-power-adapter-ep-t4510-ep-t4510xbeggb-532014377?$1164_776_PNG$'],
  ['samsung-travel-charger-25w-black', 'https://images.samsung.com/is/image/samsung/p6pim/us/ep-t2510xbegus/gallery/us-25w-power-adapter-ep-t2510-579798-ep-t2510xbegus-553272381?$product-details-jpg$'],
  ['samsung-travel-charger-25w-white', 'https://images.samsung.com/is/image/samsung/p6pim/us/ep-t2510xwegus/gallery/us-25w-power-adapter-ep-t2510-579798-ep-t2510xwegus-551043861?$product-details-jpg$'],
  ['prodigee-mag-power-to-go-10k-cream', 'https://cdn.shopify.com/s/files/1/0205/5216/files/MagPower-2-Go-10K-v2_Cream_01.jpg?v=1709026286'],
  ['prodigee-mag-power-to-go-10k-metallic', 'https://cdn.shopify.com/s/files/1/0205/5216/files/MagPower-2-Go-10K-v2_Black_01.jpg?v=1710748767'],
  ['prodigee-energee-mini-car-charger', 'https://cdn.shopify.com/s/files/1/0205/5216/products/mini-prodigee-01.jpg?v=1653294242'],
  ['prodigee-mag-da-beat-silver', 'https://cdn.shopify.com/s/files/1/0205/5216/files/magdabeat-silver-01.jpg?v=1773576903'],
]

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

async function run() {
  const results = []
  for (const [slug, src] of PRODUCTOS) {
    try {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok) throw new Error(`descarga HTTP ${res.status}`)
      let ct = (res.headers.get('content-type') || '').split(';')[0].trim()
      if (!EXT[ct]) {
        // algunos CDN devuelven octet-stream: inferimos por la firma del archivo
        ct = 'image/jpeg'
      }
      const ext = EXT[ct]
      const buf = Buffer.from(await res.arrayBuffer())
      const path = `seed/${slug}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: ct, upsert: true })
      if (upErr) throw new Error(`upload: ${upErr.message}`)

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const url = pub.publicUrl

      const { error: dbErr, count } = await supabase
        .from('productos')
        .update({ imagenes: [url] }, { count: 'exact' })
        .eq('slug', slug)
      if (dbErr) throw new Error(`db: ${dbErr.message}`)

      results.push({ slug, ok: true, kb: Math.round(buf.length / 1024), rows: count, url })
      console.log(`✓ ${slug.padEnd(40)} ${Math.round(buf.length / 1024)}KB  filas=${count}`)
    } catch (e) {
      results.push({ slug, ok: false, error: e.message })
      console.log(`✗ ${slug.padEnd(40)} ERROR: ${e.message}`)
    }
  }
  const ok = results.filter((r) => r.ok).length
  console.log(`\nResumen: ${ok}/${PRODUCTOS.length} subidas y vinculadas.`)
  const noRows = results.filter((r) => r.ok && r.rows === 0)
  if (noRows.length) {
    console.log('⚠ Subidas pero el slug no existe en la tabla productos:')
    noRows.forEach((r) => console.log('   - ' + r.slug))
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
