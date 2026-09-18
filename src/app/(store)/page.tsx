import { createClient } from '@/lib/supabase/server'
import { HeroDual } from '@/components/store/HeroDual'
import { StoresMarquee } from '@/components/store/StoresMarquee'
import { DosModelos } from '@/components/store/DosModelos'
import { HeroBanner } from '@/components/store/HeroBanner'
import { CategoryRow } from '@/components/store/CategoryRow'
import { ProductCarousel } from '@/components/store/ProductCarousel'
import { ComoFunciona } from '@/components/store/ComoFunciona'
import { PromoBanner } from '@/components/store/PromoBanner'
import { FeaturesBar } from '@/components/store/FeaturesBar'
import { Faq } from '@/components/store/Faq'
import { CtaFinal } from '@/components/store/CtaFinal'
import { getBannersActivos, getCategoriasActivas, getTiendaConfig } from '@/lib/cache/cms'
import type { Producto } from '@/types'

/**
 * ISR — la home se regenera cada 60 s.
 *
 * Los server actions del admin hacen `revalidatePath('/')` al guardar banners,
 * productos o textos, así que un cambio se ve en segundos y no hay que esperar
 * la ventana completa.
 */
export const revalidate = 60

export default async function HomePage() {
  const supabase = createClient()

  const [slides, config, categoriasFull, productosRes] = await Promise.all([
    getBannersActivos(),
    getTiendaConfig(),
    getCategoriasActivas(),
    supabase
      .from('productos')
      // Con variantes: la tarjeta pregunta color y capacidad antes de agregar
      .select('*, variantes(*)')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const categorias = categoriasFull.slice(0, 8)
  const todos = (productosRes.data as Producto[]) || []

  const lanzamientos = todos.slice(0, 10)
  const destacados = todos.filter((p) => p.destacado).slice(0, 10)
  const heroProducto = destacados[0] ?? lanzamientos[0] ?? null

  return (
    <>
      {/* 1. La promesa y los dos modelos de negocio */}
      <HeroDual producto={heroProducto} />

      {/* 2. Dónde compramos por encargo */}
      <StoresMarquee />

      {/* 3. Las dos formas de comprar, al mismo nivel */}
      <DosModelos />

      {/* 4. Banners del CMS — solo si el admin configuró alguno */}
      {slides.length > 0 && <HeroBanner slides={slides} />}

      {/* 5. Catálogo */}
      <CategoryRow categorias={categorias} />

      <div className="bg-hueso">
        <ProductCarousel
          productos={lanzamientos}
          titulo="Nuevos lanzamientos"
          subtitulo="Recién llegados"
          verTodosHref="/productos"
        />
      </div>

      {/* 6. Cómo funciona cada modelo */}
      <ComoFunciona />

      {/* 7. Destacado editorial del CMS */}
      <PromoBanner
        tag={config?.promo_tag}
        titulo={config?.promo_titulo}
        descripcion={config?.promo_descripcion ?? undefined}
        descuento={config?.promo_descuento}
        ctaLabel={config?.promo_cta_label}
        ctaHref={config?.promo_cta_href}
        imagen={config?.promo_imagen ?? undefined}
      />

      {/* 8. Destacados */}
      {destacados.length > 0 && (
        <ProductCarousel
          productos={destacados}
          titulo="Destacados"
          subtitulo="Selección de la tienda"
          verTodosHref="/productos"
        />
      )}

      {/* 9. Confianza */}
      <FeaturesBar config={config} />

      {/* 10. Objeciones */}
      <Faq />

      {/* 11. Cierre */}
      <CtaFinal whatsapp={config?.footer_whatsapp} />
    </>
  )
}
