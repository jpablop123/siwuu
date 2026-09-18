'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuscador } from './BusquedaProvider'

/**
 * La barra de búsqueda del header.
 *
 * Es un botón con forma de campo: al tocarla abre el buscador completo, que en
 * móvil ocupa la pantalla y deja espacio real para los resultados. Siempre
 * visible — nunca un ícono escondido — porque buscar es la forma más corta de
 * llegar a un producto.
 */
export function BarraBusqueda({ className }: { className?: string }) {
  const { abrir } = useBuscador()
  const [atajo, setAtajo] = useState('Ctrl K')

  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.userAgent)) setAtajo('⌘ K')
  }, [])

  return (
    <button
      type="button"
      onClick={() => abrir()}
      aria-haspopup="dialog"
      className={cn(
        'flex h-10 min-w-0 items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 text-left text-sm text-ink-500 transition-colors',
        'hover:border-ink-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400 dark:hover:border-ink-600',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">Buscar iPhone, Mac, cargadores…</span>
      <kbd className="hidden shrink-0 rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-500 lg:inline dark:border-ink-700 dark:bg-ink-800">
        {atajo}
      </kbd>
    </button>
  )
}
