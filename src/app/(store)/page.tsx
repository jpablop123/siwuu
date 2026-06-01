import { createClient } from '@/lib/supabase/server'
import { HeroBanner } from '@/components/store/HeroBanner'
import { CategoryRow } from '@/components/store/CategoryRow'
import { ProductCarousel } from '@/components/store/ProductCarousel'
import { PromoBanner } from '@/components/store/PromoBanner'
import { FeaturesBar } from '@/components/store/FeaturesBar'
import { getBannersActivos, getCategoriasActivas, getTiendaConfig } from '@/lib/cache/cms'
import type { Producto } from '@/types'

/**
 * ISR — la home se regenera cada 60 s.
 *
 * Antes tenía `force-dynamic` → render desde cero en cada visit → 4 queries
 * a Supabase en cada hit. Para una home pública que cambia raramente
 * (banners, destacados, categorías) eso es desperdicio.
 *
 * Con `revalidate = 60`, Next sirve la versión cacheada de edge para todos
 * los visitantes durante 60 s. La primera request después del minuto
 * regenera en background sin bloquear al usuario.
 *
 * Si el admin guarda un banner o producto, los server actions ya hacen
 * `revalidatePath('/')` (ver admin.ts), así que el cambio se ve en
 * segundos, no esperando los 60 s.
 */
export const revalidate = 60

export default async function HomePage() {
  const supabase = createClient()

  // 3 queries CMS cacheadas en memoria (Next unstable_cache, 5 min TTL)
  // + 1 query no-cacheable (productos pueden cambiar más seguido).
  // En el caso típico, las 3 primeras devuelven 0 ms; queda solo la 4ta.
  const [slides, config, categoriasFull, productosRes] = await Promise.all([
    getBannersActivos(),
    getTiendaConfig(),
    getCategoriasActivas(),
    supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const categorias = categoriasFull.slice(0, 8)
  const todos = (productosRes.data as Producto[]) || []

  const lanzamientos = todos.slice(0, 10)
  const destacados = todos.filter((p) => p.destacado).slice(0, 10)

  return (
    <>
      {/* 1. Hero — dinámico desde DB, fallback a slides estáticos */}
      <HeroBanner slides={slides} />

      {/* 2. Categorías */}
      <CategoryRow categorias={categorias} />

      {/* 3. Nuevos lanzamientos */}
      <div className="bg-zinc-50 dark:bg-zinc-900/40">
        <ProductCarousel
          productos={lanzamientos}
          titulo="Nuevos lanzamientos"
          subtitulo="Recién llegados"
          verTodosHref="/productos"
          accentColor="emerald"
        />
      </div>

      {/* 4. Promo banner — dinámico desde DB, fallback a valores por defecto */}
      <PromoBanner
        tag={config?.promo_tag}
        titulo={config?.promo_titulo}
        descripcion={config?.promo_descripcion ?? undefined}
        descuento={config?.promo_descuento}
        ctaLabel={config?.promo_cta_label}
        ctaHref={config?.promo_cta_href}
        imagen={config?.promo_imagen ?? undefined}
      />

      {/* 5. Destacados */}
      {destacados.length > 0 && (
        <ProductCarousel
          productos={destacados}
          titulo="Los más vendidos"
          subtitulo="Favoritos de la tienda"
          verTodosHref="/productos"
          accentColor="violet"
        />
      )}

      {/* 6. Trust signals */}
      <FeaturesBar />
    </>
  )
}
