'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import type { Categoria } from '@/types'

interface OrdenOption {
  readonly value: string
  readonly label: string
}

interface CatalogoFiltersProps {
  categorias: Categoria[]
  categoriaActiva?: string
  precioMin?: string
  precioMax?: string
  ordenActivo?: string
  ordenOptions: readonly OrdenOption[]
  searchQuery?: string
  basePath: string
  currentParams: Record<string, string | undefined>
}

export function CatalogoFilters({
  categorias,
  categoriaActiva,
  precioMin,
  precioMax,
  ordenActivo,
  ordenOptions,
  searchQuery,
  basePath,
  currentParams,
}: CatalogoFiltersProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [minLocal, setMinLocal] = useState(precioMin || '')
  const [maxLocal, setMaxLocal] = useState(precioMax || '')

  function buildHref(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams()
    const merged = { ...currentParams, ...overrides }
    for (const [key, val] of Object.entries(merged)) {
      if (val) params.set(key, val)
    }
    const qs = params.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }

  const hasFilters = categoriaActiva || precioMin || precioMax || ordenActivo

  const handlePrecioSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(
      buildHref({
        precio_min: minLocal || undefined,
        precio_max: maxLocal || undefined,
        page: undefined,
      })
    )
    setMobileOpen(false)
  }

  const filterContent = (
    <div className="space-y-6">
      {/* Categorías */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Categorías
        </h3>
        <ul className="space-y-1.5">
          <li>
            <Link
              href={buildHref({ categoria: undefined, page: undefined })}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm transition-colors',
                !categoriaActiva
                  ? 'bg-emerald-500/10 font-semibold text-emerald-400'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              Todas
            </Link>
          </li>
          {categorias.map((cat) => (
            <li key={cat.id}>
              <Link
                href={buildHref({ categoria: cat.slug, page: undefined })}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  categoriaActiva === cat.slug
                    ? 'bg-emerald-500/10 font-semibold text-emerald-400'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
              >
                {cat.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Rango de precio */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Rango de precio
        </h3>
        <form onSubmit={handlePrecioSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={minLocal}
              onChange={(e) => setMinLocal(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-transparent"
              min="0"
              aria-label="Precio mínimo"
            />
            <span className="text-zinc-500">–</span>
            <input
              type="number"
              placeholder="Máx"
              value={maxLocal}
              onChange={(e) => setMaxLocal(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-transparent"
              min="0"
              aria-label="Precio máximo"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Aplicar
          </button>
        </form>
      </div>

      {/* Ordenar */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Ordenar por
        </h3>
        <ul className="space-y-1.5">
          {ordenOptions.map((opt) => (
            <li key={opt.value}>
              <Link
                href={buildHref({
                  orden: opt.value || undefined,
                  page: undefined,
                })}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  (ordenActivo || '') === opt.value
                    ? 'bg-emerald-500/10 font-semibold text-emerald-400'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
              >
                {opt.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Limpiar filtros */}
      {hasFilters && (
        <Link
          href={`/productos${searchQuery ? `?q=${searchQuery}` : ''}`}
          onClick={() => setMobileOpen(false)}
          className="block rounded-lg border border-zinc-200 px-3 py-2 text-center text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Limpiar filtros
        </Link>
      )}
    </div>
  )

  return (
    <>
      {/* Botón mobile para abrir filtros */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtros
        {hasFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950">
            !
          </span>
        )}
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-28">{filterContent}</div>
      </aside>

      {/* Sheet mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl animate-slide-in-right dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Filtros</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Cerrar filtros"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">{filterContent}</div>
          </div>
        </div>
      )}
    </>
  )
}
