import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Tecnología original traída de Estados Unidos: iPhone, Mac, Samsung y accesorios con precio en pesos y envío a toda Colombia.',
}

interface Props {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ProductosPage({ searchParams }: Props) {
  const filtros = parseFiltros(searchParams)
  const pagina = paginaDesde(searchParams)

  // Las categorías salen del caché compartido; solo se esperan antes de la
  // consulta cuando hace falta traducir el slug a id.
  const categoriasPromise = getCategoriasActivas()
  const categoriaId = filtros.categoria
    ? (await categoriasPromise).find((c) => c.slug === filtros.categoria)?.id ?? null
    : null

  const [categorias, { productos, total }] = await Promise.all([
    categoriasPromise,
    buscarProductos(filtros, categoriaId, pagina),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <FiltrosProvider filtros={filtros} modo="catalogo" total={total} categorias={categorias}>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-3 lg:mb-6">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 sm:text-3xl dark:text-white">
            {filtros.q ? `Resultados para “${filtros.q}”` : 'Catálogo'}
          </h1>
          <p className="mt-1 text-sm text-ink-500 lg:hidden dark:text-ink-400">
            {total} producto{total === 1 ? '' : 's'}
          </p>
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
                createHref={(p) => urlCatalogo(filtros, 'catalogo', p)}
              />
            </ResultadosCatalogo>
          </div>
        </div>
      </div>
    </FiltrosProvider>
  )
}
