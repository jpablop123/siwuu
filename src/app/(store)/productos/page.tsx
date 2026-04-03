import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/store/ProductGrid'
import { Pagination } from '@/components/store/Pagination'
import { CatalogoFilters } from './CatalogoFilters'
import type { Producto, Categoria } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catálogo de Productos',
  description:
    'Explora todos nuestros productos con los mejores precios y envío a toda Colombia.',
}

const PER_PAGE = 12

const ORDEN_OPTIONS = [
  { value: '', label: 'Destacados' },
  { value: 'nuevo', label: 'Más nuevos' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
] as const

interface Props {
  searchParams: {
    q?: string
    categoria?: string
    precio_min?: string
    precio_max?: string
    orden?: string
    page?: string
  }
}

export default async function ProductosPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, categoria, precio_min, precio_max, orden, page } = searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))

  // Fetch categorías para el sidebar
  const { data: categoriasRaw } = await supabase
    .from('categorias')
    .select('*')
    .eq('activa', true)
    .order('orden')

  const categorias = (categoriasRaw as Categoria[]) || []

  // Resolver categoría slug → id
  let categoriaId: string | null = null
  if (categoria) {
    const cat = categorias.find((c) => c.slug === categoria)
    if (cat) categoriaId = cat.id
  }

  // Construir query de productos
  let query = supabase
    .from('productos')
    .select('*', { count: 'exact' })
    .eq('activo', true)

  if (q) {
    query = query.ilike('nombre', `%${q}%`)
  }
  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }
  if (precio_min) {
    const min = parseInt(precio_min)
    if (!isNaN(min)) query = query.gte('precio_venta', min)
  }
  if (precio_max) {
    const max = parseInt(precio_max)
    if (!isNaN(max)) query = query.lte('precio_venta', max)
  }

  switch (orden) {
    case 'precio_asc':
      query = query.order('precio_venta', { ascending: true })
      break
    case 'precio_desc':
      query = query.order('precio_venta', { ascending: false })
      break
    case 'nuevo':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query
        .order('destacado', { ascending: false })
        .order('created_at', { ascending: false })
  }

  const from = (currentPage - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  const { data: productos, count } = await query
  const totalPages = Math.ceil((count || 0) / PER_PAGE)

  const currentParams = { q, categoria, precio_min, precio_max, orden }

  // Helper para construir hrefs preservando searchParams
  function buildHref(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams()
    const merged = { ...currentParams, ...overrides }
    for (const [key, val] of Object.entries(merged)) {
      if (val) params.set(key, val)
    }
    const qs = params.toString()
    return `/productos${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {q ? `Resultados para "${q}"` : 'Todos los productos'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {count || 0} producto{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Sidebar de filtros */}
        <CatalogoFilters
          categorias={categorias}
          categoriaActiva={categoria}
          precioMin={precio_min}
          precioMax={precio_max}
          ordenActivo={orden}
          ordenOptions={ORDEN_OPTIONS}
          searchQuery={q}
          basePath="/productos"
          currentParams={currentParams}
        />

        {/* Contenido principal */}
        <div>
          {/* Barra superior: orden en mobile + conteo */}
          <div className="mb-4 flex items-center justify-between sm:mb-6">
            <p className="hidden text-sm text-zinc-500 sm:block">
              Mostrando {from + 1}–{Math.min(from + PER_PAGE, count || 0)} de{' '}
              {count || 0}
            </p>
            <div className="ml-auto">
              <label htmlFor="orden-select" className="sr-only">
                Ordenar por
              </label>
              <select
                id="orden-select"
                defaultValue={orden || ''}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {ORDEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de productos */}
          <ProductGrid productos={(productos as Producto[]) || []} />

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            createHref={(p) => buildHref({ page: p > 1 ? p.toString() : undefined })}
          />
        </div>
      </div>
    </div>
  )
}
