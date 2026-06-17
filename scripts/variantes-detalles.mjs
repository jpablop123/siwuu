// Agrega variantes (Color + Almacenamiento) y descripciones/specs completas.
// Idempotente: borra variantes previas de cada producto y las recrea.
// Correr: node --env-file=.env.local scripts/variantes-detalles.mjs
import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// slug -> { colores?, alm?, desc }
const DATA = {
  'iphone-17e': {
    colores: ['Negro', 'Rosa suave', 'Blanco'],
    alm: ['128 GB', '256 GB', '512 GB'],
    desc: `El iPhone más accesible, con lo esencial de la experiencia Apple.

• Chip A19 con Neural Engine
• Pantalla Super Retina XDR de 6.1"
• Cámara Fusion de 48 MP
• Hasta 26 h de reproducción de video
• Face ID y conector USB-C
• Apple Intelligence integrada

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'iphone-17': {
    colores: ['Negro', 'Lavanda', 'Azul niebla', 'Salvia', 'Blanco'],
    alm: ['256 GB', '512 GB'],
    desc: `El equilibrio perfecto entre potencia, cámara y precio.

• Chip A19 con Neural Engine
• Pantalla Super Retina XDR de 6.3" con ProMotion 120 Hz
• Sistema de cámaras Fusion de 48 MP
• Hasta 30 h de reproducción de video
• Face ID, USB-C y Apple Intelligence

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'iphone-air': {
    colores: ['Negro espacial', 'Blanco nube', 'Oro claro', 'Azul cielo'],
    alm: ['256 GB', '512 GB', '1 TB'],
    desc: `El iPhone más delgado jamás creado: solo 5,6 mm.

• Chip A19 Pro
• Pantalla Super Retina XDR de 6.5" con ProMotion
• Cámara Fusion de 48 MP
• Diseño en titanio ultraligero
• Face ID, USB-C y Apple Intelligence

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'iphone-17-pro': {
    colores: ['Naranja cósmico', 'Azul profundo', 'Plata'],
    alm: ['256 GB', '512 GB', '1 TB', '2 TB'],
    desc: `Potencia profesional en un cuerpo de titanio.

• Chip A19 Pro
• Pantalla Super Retina XDR de 6.3" con ProMotion 120 Hz
• Triple cámara Pro de 48 MP + teleobjetivo
• Zoom óptico hasta 8x
• Grabación en ProRes y Action mode
• USB-C (USB 3) y Apple Intelligence

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'iphone-17-pro-max': {
    colores: ['Naranja cósmico', 'Azul profundo', 'Plata'],
    alm: ['256 GB', '512 GB', '1 TB', '2 TB'],
    desc: `El iPhone más potente y con la mejor batería.

• Chip A19 Pro
• Pantalla Super Retina XDR de 6.9" con ProMotion 120 Hz
• Triple cámara Pro de 48 MP + teleobjetivo
• Zoom óptico hasta 8x
• La batería más grande de un iPhone
• USB-C (USB 3) y Apple Intelligence

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'macbook-air-13-m5': {
    colores: ['Medianoche', 'Blanco estrella', 'Gris espacial', 'Azul cielo'],
    alm: ['256 GB', '512 GB', '1 TB', '2 TB'],
    desc: `Ultraligera, silenciosa y con una batería que dura todo el día.

• Chip M5 (CPU 10 núcleos)
• Pantalla Liquid Retina de 13,6"
• Hasta 18 h de batería
• Cámara Center Stage 12 MP
• Dos puertos Thunderbolt 4, MagSafe
• Sin ventilador — totalmente silenciosa

Nueva y sellada. Traída desde USA por tu personal shopper.`,
  },
  'macbook-air-15-m5': {
    colores: ['Medianoche', 'Blanco estrella', 'Gris espacial', 'Azul cielo'],
    alm: ['256 GB', '512 GB', '1 TB', '2 TB'],
    desc: `Más pantalla, el mismo peso pluma.

• Chip M5 (CPU 10 núcleos)
• Pantalla Liquid Retina de 15,3"
• Hasta 18 h de batería
• Cámara Center Stage 12 MP
• Sonido de seis altavoces
• Dos puertos Thunderbolt 4, MagSafe

Nueva y sellada. Traída desde USA por tu personal shopper.`,
  },
  'macbook-pro-14-m5': {
    colores: ['Negro espacial', 'Plata'],
    alm: ['512 GB', '1 TB', '2 TB'],
    desc: `Rendimiento profesional en un portátil compacto.

• Chip M5 (opción M5 Pro / M5 Max)
• Pantalla Liquid Retina XDR de 14"
• Hasta 24 h de batería
• Puertos Thunderbolt, HDMI, ranura SD y MagSafe
• Cámara Center Stage 12 MP

Nueva y sellada. Traída desde USA por tu personal shopper.`,
  },
  'macbook-pro-16-m5-pro': {
    colores: ['Negro espacial', 'Plata'],
    alm: ['512 GB', '1 TB', '2 TB'],
    desc: `La MacBook Pro más potente para trabajo pesado.

• Chip M5 Pro (opción M5 Max)
• Pantalla Liquid Retina XDR de 16"
• Hasta 24 h de batería
• Puertos Thunderbolt, HDMI, ranura SD y MagSafe
• Sistema de seis altavoces de alta fidelidad

Nueva y sellada. Traída desde USA por tu personal shopper.`,
  },
  'imac-m4': {
    colores: ['Azul', 'Verde', 'Rosa', 'Plata'],
    alm: ['256 GB', '512 GB', '1 TB'],
    desc: `Todo en uno, delgado y lleno de color.

• Chip M4
• Pantalla Retina 4.5K de 24"
• Cámara Center Stage 12 MP
• Cuatro puertos USB-C / Thunderbolt
• Teclado, mouse y trackpad a juego (según config)

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'mac-mini-m4': {
    alm: ['256 GB', '512 GB', '1 TB'],
    desc: `El escritorio Mac más compacto y potente.

• Chip M4 (opción M4 Pro)
• Diseño de solo 12,7 cm
• Thunderbolt, HDMI y puertos USB-C frontales
• Apple Intelligence
• Conéctale tu propio monitor, teclado y mouse

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },
  'mac-studio-m4-max': {
    alm: ['512 GB', '1 TB', '2 TB'],
    desc: `Potencia de estación de trabajo en tu escritorio.

• Chip M4 Max (opción M3 Ultra)
• Thunderbolt 5 de alta velocidad
• Múltiples puertos USB-C, HDMI y SD frontal
• Ideal para video, 3D y desarrollo

Nuevo y sellado. Traído desde USA por tu personal shopper.`,
  },

  // ── Accesorios (solo descripción) ──────────────────────────────
  'apple-home-power-adapter-20w-usb-c': { desc: `Adaptador de corriente de 20W con puerto USB-C.\n\n• Carga rápida para iPhone y iPad\n• Compacto, ideal para casa o viaje\n• Original Apple` },
  'apple-earpods-usb-c': { desc: `Audífonos EarPods con conector USB-C.\n\n• Sonido nítido y graves potentes\n• Control de volumen y micrófono integrados\n• Compatibles con iPhone 15/16/17, iPad y Mac USB-C` },
  'apple-earpods-lightning': { desc: `Audífonos EarPods con conector Lightning (A1748).\n\n• Sonido de alta calidad\n• Control remoto y micrófono\n• Para iPhone con puerto Lightning` },
  'apple-usb-c-to-usb-c-woven-cable-1m': { desc: `Cable trenzado USB-C a USB-C de 1 metro.\n\n• Tejido resistente y duradero\n• Carga y sincronización\n• Original Apple` },
  'apple-cable-type-c-to-lightning': { desc: `Cable USB-C a Lightning.\n\n• Carga rápida para iPhone con Lightning\n• Sincronización de datos\n• Original Apple` },
  'samsung-travel-charger-45w': { desc: `Cargador de viaje Samsung de 45W con cable C-to-C incluido.\n\n• Súper carga rápida (Super Fast Charging 2.0)\n• Ideal para Galaxy, tablets y portátiles USB-C\n• Cable USB-C a USB-C en la caja` },
  'samsung-travel-charger-25w-black': { desc: `Cargador rápido Samsung de 25W con USB-C — Negro.\n\n• Carga rápida para Galaxy y otros USB-C\n• Compacto y eficiente\n• Color negro` },
  'samsung-travel-charger-25w-white': { desc: `Cargador rápido Samsung de 25W con USB-C — Blanco.\n\n• Carga rápida para Galaxy y otros USB-C\n• Compacto y eficiente\n• Color blanco` },
  'prodigee-mag-power-to-go-10k-cream': { desc: `Power bank magnético MagSafe de 10.000 mAh — Crema.\n\n• Se adhiere magnéticamente al iPhone\n• Carga inalámbrica + puerto USB-C\n• Diseño elegante para llevar` },
  'prodigee-mag-power-to-go-10k-metallic': { desc: `Power bank magnético MagSafe de 10.000 mAh — Metálico.\n\n• Se adhiere magnéticamente al iPhone\n• Carga inalámbrica + puerto USB-C\n• Acabado metálico premium` },
  'prodigee-energee-mini-car-charger': { desc: `Cargador para auto Prodigee Energee Mini.\n\n• Carga rápida USB-C en el carro\n• Diseño compacto\n• Compatible con iPhone, Galaxy y más` },
  'parlante-bluetooth-prodigee-mag-da-beat-con-magsafe---plateado': { desc: `Parlante Bluetooth Prodigee Mag Da Beat con MagSafe — Plateado.\n\n• Se adhiere magnéticamente (MagSafe)\n• Sonido potente y portátil\n• Batería recargable vía USB-C` },
}

async function main() {
  const { data: prods } = await s.from('productos').select('id,slug')
  const id = Object.fromEntries(prods.map((p) => [p.slug, p.id]))

  for (const [slug, info] of Object.entries(DATA)) {
    const pid = id[slug]
    if (!pid) { console.log(`! no existe: ${slug}`); continue }

    // descripción
    await s.from('productos').update({ descripcion: info.desc }).eq('id', pid)

    // variantes: limpiar y recrear
    await s.from('variantes').delete().eq('producto_id', pid)
    const filas = []
    for (const c of info.colores || []) filas.push({ producto_id: pid, nombre: 'Color', valor: c, precio_adicional: 0, disponible: true })
    for (const a of info.alm || []) filas.push({ producto_id: pid, nombre: 'Almacenamiento', valor: a, precio_adicional: 0, disponible: true })
    if (filas.length) {
      const { error } = await s.from('variantes').insert(filas)
      if (error) { console.log(`✗ ${slug}: ${error.message}`); continue }
    }
    console.log(`✓ ${slug.padEnd(42)} ${(info.colores || []).length} colores · ${(info.alm || []).length} almacen.`)
  }
  console.log('\nListo.')
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
