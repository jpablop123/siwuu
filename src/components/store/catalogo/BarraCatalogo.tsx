'use client'

import { useCallback, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { ORDEN_OPCIONES, contarFiltros } from '@/lib/catalogo'
import { useFiltros } from './FiltrosProvider'
import { HojaFiltros } from './HojaFiltros'

/**
 * Barra sobre la grilla: filtros y orden.
 *
 * En móvil queda pegada debajo del header al hacer scroll, para que filtrar u
 * ordenar nunca obligue a volver arriba. En desktop los filtros ya están en el
 * sidebar, así que solo muestra el conteo y el orden.
 *
 * El orden usa un <select> nativo a propósito: en Android abre el selector del
 * sistema, que es más rápido de usar que cualquier menú propio y no pesa nada.
 */
export function BarraCatalogo() {
  const { filtros, aplicar, total } = useFiltros()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const cerrarHoja = useCallback(() => setHojaAbierta(false), [])

  const activos = contarFiltros(filtros)

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-ink-200 bg-white/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mb-4 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none dark:border-ink-800 dark:bg-ink-950/95">
        <button
          type="button"
          onClick={() => setHojaAbierta(true)}
          className="flex h-11 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden dark:border-ink-700 dark:bg-ink-900 dark:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros
          {activos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
              {activos}
            </span>
          )}
        </button>

        <p className="hidden text-sm text-ink-500 lg:block dark:text-ink-400">
          {total} producto{total === 1 ? '' : 's'}
        </p>

        <label className="ml-auto flex min-w-0 items-center gap-2">
          <span className="hidden text-sm text-ink-500 sm:inline dark:text-ink-400">Ordenar</span>
          <select
            id="catalogo-orden"
            value={filtros.orden ?? ''}
            onChange={(e) => aplicar({ orden: e.target.value || undefined })}
            className="h-11 min-w-0 rounded-lg border border-ink-200 bg-white pl-3 pr-8 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 lg:h-9 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          >
            {ORDEN_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <HojaFiltros abierta={hojaAbierta} onCerrar={cerrarHoja} />
    </>
  )
}
