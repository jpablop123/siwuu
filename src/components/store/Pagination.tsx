import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Función que recibe el número de página y retorna el href completo */
  createHref: (page: number) => string
}

export function Pagination({ currentPage, totalPages, createHref }: PaginationProps) {
  if (totalPages <= 1) return null

  // Generar rango de páginas visibles (máx 5 alrededor de la actual)
  const pages = getVisiblePages(currentPage, totalPages)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Paginación">
      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={createHref(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      )}

      {/* Números */}
      {pages.map((page, i) =>
        page === null ? (
          <span key={`dots-${i}`} className="flex h-10 w-10 items-center justify-center text-zinc-500">
            &hellip;
          </span>
        ) : (
          <Link
            key={page}
            href={createHref(page)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Página ${page}`}
          >
            {page}
          </Link>
        )
      )}

      {/* Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={createHref(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}

/** Genera el array de páginas visibles con ellipsis (null) */
function getVisiblePages(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | null)[] = [1]

  if (current > 3) {
    pages.push(null)
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push(null)
  }

  pages.push(total)

  return pages
}
