'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  totalItems: number
  perPage: number
  /** Nombre del query param que representa la página (default: "page") */
  paramName?: string
}

export function PaginationControls({ totalItems, perPage, paramName = 'page' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Math.max(1, parseInt(searchParams.get(paramName) ?? '1', 10))
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  if (totalPages <= 1) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete(paramName)
    } else {
      params.set(paramName, String(page))
    }
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  // Genera ventana de páginas: siempre muestra hasta 5 alrededor de la actual
  function buildPages(): Array<number | '…'> {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: Array<number | '…'> = [1]
    if (currentPage > 3) pages.push('…')
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      pages.push(p)
    }
    if (currentPage < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  const pages = buildPages()

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Página {currentPage} de {totalPages} · {totalItems} resultados
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-zinc-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
