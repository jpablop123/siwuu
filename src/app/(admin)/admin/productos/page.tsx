import { createClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils'
import { Pagination } from '@/components/store/Pagination'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { FiltrosProductosAdmin } from './FiltrosProductosAdmin'
import { ToggleActivo } from './ToggleActivo'
import { EliminarProductoBtn } from './EliminarProductoBtn'

export const metadata: Metadata = {
  title: 'Productos - Admin',
  robots: 'noindex',
}

const PER_PAGE = 20

interface Props {
  searchParams: { q?: string; categoria?: string; proveedor?: string; activo?: string; page?: string }
}

export default async function AdminProductosPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, categoria, proveedor, activo, page } = searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))

  // Fetch categorías y proveedores para filtros
  const [catRes, provRes] = await Promise.all([
    supabase.from('categorias').select('id, nombre, slug').eq('activa', true).order('nombre'),
    supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  const categorias = (catRes.data || []) as Array<{ id: string; nombre: string; slug: string }>
  const proveedores = (provRes.data || []) as Array<{ id: string; nombre: string }>

  // Query productos
  let query = supabase
    .from('productos')
    .select('*, categoria:categorias(nombre), proveedor:proveedores(nombre)', { count: 'exact' })

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (categoria) query = query.eq('categoria_id', categoria)
  if (proveedor) query = query.eq('proveedor_id', proveedor)
  if (activo === 'true') query = query.eq('activo', true)
  else if (activo === 'false') query = query.eq('activo', false)

  query = query.order('created_at', { ascending: false })

  const from = (currentPage - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  const { data: productos, count } = await query
  const totalPages = Math.ceil((count || 0) / PER_PAGE)
  const total = count || 0

  const rows = (productos || []) as Array<{
    id: string
    nombre: string
    slug: string
    imagenes: string[]
    precio_venta: number
    precio_costo: number | null
    activo: boolean
    destacado: boolean
    categoria: { nombre: string } | null
    proveedor: { nombre: string } | null
  }>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Productos ({total})</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-400 sm:px-4 sm:py-2.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Filtros */}
      <FiltrosProductosAdmin
        categorias={categorias}
        proveedores={proveedores}
        filtrosActuales={{ q, categoria, proveedor, activo }}
      />

      {/* Cards mobile */}
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((p) => {
          const margen =
            p.precio_costo && p.precio_venta > 0
              ? Math.round(((p.precio_venta - p.precio_costo) / p.precio_venta) * 100)
              : null
          return (
            <div key={p.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {p.imagenes?.[0] && (
                    <Image
                      src={p.imagenes[0]}
                      alt={p.nombre}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100"
                  >
                    {p.nombre}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {p.categoria?.nombre || '—'} · {p.proveedor?.nombre || '—'}
                  </p>
                </div>
                <ToggleActivo id={p.id} activo={p.activo} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCOP(p.precio_venta)}</span>
                  {margen !== null && (
                    <span
                      className={
                        margen > 30 ? 'text-green-600' : margen >= 15 ? 'text-yellow-600' : 'text-red-600'
                      }
                    >
                      {margen}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-xs font-medium text-indigo-600"
                  >
                    Editar
                  </Link>
                  <EliminarProductoBtn id={p.id} nombre={p.nombre} />
                </div>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Tabla desktop */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Margen</th>
                <th className="px-4 py-3 text-center">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {rows.map((p) => {
                const margen =
                  p.precio_costo && p.precio_venta > 0
                    ? Math.round(((p.precio_venta - p.precio_costo) / p.precio_venta) * 100)
                    : null
                return (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          {p.imagenes?.[0] && (
                            <Image
                              src={p.imagenes[0]}
                              alt={p.nombre}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/productos/${p.id}`}
                            className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100"
                          >
                            {p.nombre}
                          </Link>
                          <p className="text-xs text-zinc-500">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.categoria?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.proveedor?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(p.precio_venta)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-500">
                      {p.precio_costo ? formatCOP(p.precio_costo) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {margen !== null ? (
                        <span
                          className={
                            margen > 30
                              ? 'text-green-600'
                              : margen >= 15
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {margen}%
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToggleActivo id={p.id} activo={p.activo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/productos/${p.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <EliminarProductoBtn id={p.id} nombre={p.nombre} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        createHref={(p) => {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (categoria) params.set('categoria', categoria)
          if (proveedor) params.set('proveedor', proveedor)
          if (activo) params.set('activo', activo)
          if (p > 1) params.set('page', p.toString())
          const qs = params.toString()
          return `/admin/productos${qs ? `?${qs}` : ''}`
        }}
      />
    </div>
  )
}
