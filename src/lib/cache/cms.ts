/**
 * Cache server-side de queries CMS que rara vez cambian.
 *
 * Problema:
 *   La home, /productos y /categoria/[slug] consultan `categorias` cada
 *   visit. Cada request hace round-trip a Supabase (~150 ms desde laptop,
 *   ~20 ms desde Vercel us-east-1). Como categorias cambia rara vez,
 *   es desperdicio.
 *
 * Solución:
 *   `unstable_cache` de Next.js — guarda el resultado en memoria del
 *   server por N segundos. Tras la primera request en una ventana, las
 *   siguientes leen del cache sin tocar Supabase. Cuando el admin
 *   modifica un dato, `revalidateTag(...)` lo invalida instantáneamente.
 *
 * Cómo invalidar manualmente desde admin actions:
 *   import { revalidateTag } from 'next/cache'
 *   revalidateTag('categorias')
 *   revalidateTag('banners')
 *   revalidateTag('tienda-config')
 */

import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { Categoria } from '@/types'
import type { HeroBannerSlide } from '@/components/store/HeroBanner'

/**
 * Importante: estas funciones usan `createServiceClient()` (sin cookies)
 * en vez de `createClient()`. `unstable_cache` NO permite acceder a
 * sources dinámicos (cookies, headers) adentro porque rompe el modelo
 * de caché. Como estos datos son públicos (RLS abierto en lectura),
 * usar service_role es seguro y correcto acá.
 */

// ── Categorías activas ──────────────────────────────────────────────────────

export const getCategoriasActivas = unstable_cache(
  async (): Promise<Categoria[]> => {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('orden')
    return (data as Categoria[]) ?? []
  },
  ['categorias-activas'],
  { revalidate: 300, tags: ['categorias'] },  // 5 min + invalidación por tag
)

// ── Banners del hero ────────────────────────────────────────────────────────

export const getBannersActivos = unstable_cache(
  async (): Promise<HeroBannerSlide[]> => {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('tienda_banners')
      .select('id, titulo, subtitulo, tag, imagen_url, cta_label, cta_href, cta_secundario_label, cta_secundario_href, align')
      .eq('activo', true)
      .order('orden')
      .order('created_at')
    return (data as HeroBannerSlide[]) ?? []
  },
  ['banners-activos'],
  { revalidate: 300, tags: ['banners'] },
)

// ── Configuración de tienda (singleton) ─────────────────────────────────────

interface TiendaConfig {
  promo_tag: string
  promo_titulo: string
  promo_descripcion: string | null
  promo_descuento: string
  promo_cta_label: string
  promo_cta_href: string
  promo_imagen: string | null
}

export const getTiendaConfig = unstable_cache(
  async (): Promise<TiendaConfig | null> => {
    const supabase = createServiceClient()
    const { data } = await supabase.from('tienda_configuracion').select('*').single()
    return (data as TiendaConfig) ?? null
  },
  ['tienda-config'],
  { revalidate: 300, tags: ['tienda-config'] },
)
