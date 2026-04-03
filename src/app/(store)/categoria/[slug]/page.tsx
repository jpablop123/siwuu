import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/store/ProductGrid'
import { Pagination } from '@/components/store/Pagination'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import type { Producto, Categoria } from '@/types'

const PER_PAGE = 12

const ORDEN_OPTIONS = [
  { value: '', label: 'Destacados' },
  { value: 'nuevo', label: 'Más nuevos' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
] as const

interface Props {
  params: { slug: string }
  searchParams: {
    precio_min?: string
    precio_max?: string
    orden?: string
    page?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: cat } = await supabase
    .from('categorias')
    .select('nombre, descripcion')
    .eq('slug', params.slug)
    .single()

  if (!cat) return { title: 'Categoría no encontrada' }
  return {
    title: cat.nombre,
    description: cat.descripcion || `Productos de ${cat.nombre} en SiwuuShop`,
  }
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { precio_min, precio_max, orden, page } = searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))

  const { data: categoria } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', params.slug)
    .eq('activa', true)
    .single()

  if (!categoria) notFound()

  const cat = categoria as Categoria

  // Query de productos con filtros
  let query = supabase
    .from('productos')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .eq('categoria_id', cat.id)

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

  function buildHref(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams()
    const merged = { precio_min, precio_max, orden, ...overrides }
    for (const [key, val] of Object.entries(merged)) {
      if (val) params.set(key, val)
    }
    const qs = params.toString()
    return `/categoria/${cat.slug}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-emerald-400">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <Link href="/productos" className="transition-colors hover:text-emerald-400">Productos</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{cat.nombre}</span>
      </nav>

      {/* Header con imagen de portada */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {cat.imagen_url && (
          <Image
            src={cat.imagen_url}
            alt={cat.nombre}
            width={1200}
            height={300}
            className="h-40 w-full object-cover sm:h-56"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">
            {cat.nombre}
          </h1>
          {cat.descripcion && (
            <p className="mt-1 max-w-xl text-sm text-white/80">{cat.descripcion}</p>
          )}
        </div>
      </div>

      {/* Barra superior: conteo + ordenamiento */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {count || 0} producto{count !== 1 ? 's' : ''}
        </p>
        <div>
          <label htmlFor="cat-orden" className="sr-only">Ordenar por</label>
          <select
            id="cat-orden"
            defaultValue={orden || ''}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
  )
}
