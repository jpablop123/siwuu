'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { contarFiltros } from '@/lib/catalogo'
import { PanelFiltros } from './PanelFiltros'
import { useFiltros } from './FiltrosProvider'

/**
 * Hoja inferior de filtros — solo móvil.
 *
 * Sube desde abajo porque ahí vive el pulgar, y deja ver la parte de arriba de
 * la página para que no se pierda el contexto. Los filtros aplican mientras
 * está abierta; el botón de abajo solo la cierra y dice cuántos resultados hay.
 */
export function HojaFiltros({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { total, pendiente, filtros, limpiar } = useFiltros()
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', onKey)
    }
  }, [abierta, onCerrar])

  if (!abierta) return null

  const hayFiltros = contarFiltros(filtros) > 0

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="hoja-filtros-titulo">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-ink-950/50"
        onClick={onCerrar}
        aria-label="Cerrar filtros"
        tabIndex={-1}
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] animate-slide-in-up flex-col rounded-t-2xl bg-white dark:bg-ink-900">
        {/* Asa y encabezado */}
        <div className="flex items-center justify-between border-b border-ink-200 px-4 pb-3 pt-2 dark:border-ink-800">
          <div className="flex flex-col">
            <span className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink-200 dark:bg-ink-700" aria-hidden="true" />
            <h2 id="hoja-filtros-titulo" className="font-heading text-lg font-bold text-ink-900 dark:text-white">
              Filtros
            </h2>
          </div>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-ink-800"
            aria-label="Cerrar filtros"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <PanelFiltros />
        </div>

        {/* Pie fijo */}
        <div className="flex items-center gap-3 border-t border-ink-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] dark:border-ink-800">
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="h-12 px-2 text-sm font-medium text-ink-600 underline-offset-4 hover:underline dark:text-ink-300"
            >
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="h-12 flex-1 rounded-xl bg-brand-500 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {pendiente ? 'Actualizando…' : `Ver ${total} producto${total === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
