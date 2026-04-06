import { createClient } from '@/lib/supabase/server'
import { HeroBanner, type HeroBannerSlide } from '@/components/store/HeroBanner'
import { CategoryRow } from '@/components/store/CategoryRow'
import { ProductCarousel } from '@/components/store/ProductCarousel'
import { PromoBanner } from '@/components/store/PromoBanner'
import { FeaturesBar } from '@/components/store/FeaturesBar'
import type { Producto, Categoria } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()

  // Cuatro queries en paralelo — ninguna depende de auth, todas son públicas
  const [bannersRes, configRes, categoriasRes, productosRes] = await Promise.all([
    // Hero carousel: solo slides activos, ordenados por `orden`
    supabase
      .from('tienda_banners')
      .select('id, titulo, subtitulo, tag, imagen_url, cta_label, cta_href, cta_secundario_label, cta_secundario_href, align')
      .eq('activo', true)
      .order('orden')
      .order('created_at'),

    // Singleton: configuración del promo banner
    supabase.from('tienda_configuracion').select('*').single(),

    // Categorías para la fila de navegación
    supabase.from('categorias').select('*').eq('activa', true).order('orden').limit(8),

    // Últimos 20 productos activos — separamos en JS para evitar dos queries
    supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const slides = (bannersRes.data as HeroBannerSlide[]) || []
  const config = configRes.data
  const categorias = (categoriasRes.data as Categoria[]) || []
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
