import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { ProductGrid } from '@/components/store/ProductGrid'
import { Pagination } from '@/components/store/Pagination'
import { FiltrosProvider } from '@/components/store/catalogo/FiltrosProvider'
import { BarraCatalogo } from '@/components/store/catalogo/BarraCatalogo'
import { ChipsFiltros } from '@/components/store/catalogo/ChipsFiltros'
import { PanelFiltros } from '@/components/store/catalogo/PanelFiltros'
import { ResultadosCatalogo } from '@/components/store/catalogo/ResultadosCatalogo'
import { getCategoriasActivas } from '@/lib/cache/cms'
import { buscarProductos } from '@/lib/catalogo-server'
import { POR_PAGINA, paginaDesde, parseFiltros, urlCatalogo } from '@/lib/catalogo'

interface Props {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categorias = await getCategoriasActivas()
  const cat = categorias.find((c) => c.slug === params.slug)
  if (!cat) return { title: 'Categoría no encontrada' }
  return {
    title: cat.nombre,
    description: cat.descripcion || `${cat.nombre} originales traídos de Estados Unidos, con envío a toda Colombia.`,
    alternates: { canonical: `/categoria/${cat.slug}` },
  }
}

/**
 * Página de categoría — la misma vista del catálogo, con la categoría en la
 * ruta porque es la URL que se indexa.
 *
 * Ya no lleva banner de portada: en móvil empujaba los productos debajo del
 * primer pantallazo, y la gente llega acá a ver productos, no una imagen.
 */
export default async function CategoriaPage({ params, searchParams }: Props) {
  const categorias = await getCategoriasActivas()
  const cat = categorias.find((c) => c.slug === params.slug)
  if (!cat) notFound()

  // La categoría manda la ruta; lo que venga en la query se ignora.
  const filtros = { ...parseFiltros(searchParams), q: undefined, categoria: cat.slug }
  const pagina = paginaDesde(searchParams)

  const { productos, total } = await buscarProductos(filtros, cat.id, pagina)
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <FiltrosProvider filtros={filtros} modo="categoria" total={total} categorias={categorias}>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <nav className="mb-3 flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400" aria-label="Ruta de navegación">
          <Link href="/" className="hover:text-ink-900 dark:hover:text-white">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <Link href="/productos" className="hover:text-ink-900 dark:hover:text-white">Catálogo</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-ink-900 dark:text-white">{cat.nombre}</span>
        </nav>

        <header className="mb-3 lg:mb-6">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 sm:text-3xl dark:text-white">
            {cat.nombre}
          </h1>
          {cat.descripcion && (
            <p className="mt-1 line-clamp-1 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{cat.descripcion}</p>
          )}
        </header>

        <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-8">
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="sticky top-24">
              <PanelFiltros />
            </div>
          </aside>

          <div className="min-w-0">
            <BarraCatalogo />
            <ChipsFiltros />
            <ResultadosCatalogo>
              <ProductGrid productos={productos} />
              <Pagination
                currentPage={pagina}
                totalPages={totalPaginas}
                createHref={(p) => urlCatalogo(filtros, 'categoria', p)}
              />
            </ResultadosCatalogo>
          </div>
        </div>
      </div>
    </FiltrosProvider>
  )
}
