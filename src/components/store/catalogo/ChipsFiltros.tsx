'use client'

import { X } from 'lucide-react'
import { ORDEN_OPCIONES, etiquetaPrecio, type FiltrosCatalogo } from '@/lib/catalogo'
import { useFiltros } from './FiltrosProvider'

interface Chip {
  clave: string
  etiqueta: string
  quitar: Partial<FiltrosCatalogo>
}

/**
 * Filtros activos, removibles con un toque.
 *
 * Sin esto, en móvil la única forma de saber qué está filtrado es volver a
 * abrir la hoja de filtros. En móvil los chips hacen scroll horizontal en una
 * sola fila para no empujar los productos hacia abajo.
 */
export function ChipsFiltros() {
  const { filtros, aplicar, limpiar, categorias } = useFiltros()

  const chips: Chip[] = []

  if (filtros.q) {
    chips.push({ clave: 'q', etiqueta: `“${filtros.q}”`, quitar: { q: undefined } })
  }
  if (filtros.categoria) {
    const nombre = categorias.find((c) => c.slug === filtros.categoria)?.nombre ?? filtros.categoria
    chips.push({ clave: 'categoria', etiqueta: nombre, quitar: { categoria: undefined } })
  }
  const precio = etiquetaPrecio(filtros.precio_min, filtros.precio_max)
  if (precio) {
    chips.push({ clave: 'precio', etiqueta: precio, quitar: { precio_min: undefined, precio_max: undefined } })
  }
  if (filtros.orden) {
    const orden = ORDEN_OPCIONES.find((o) => o.value === filtros.orden)?.label
    if (orden) chips.push({ clave: 'orden', etiqueta: orden, quitar: { orden: undefined } })
  }

  if (chips.length === 0) return null

  return (
    <div className="-mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => (
        <button
          key={chip.clave}
          type="button"
          onClick={() => aplicar(chip.quitar)}
          aria-label={`Quitar filtro: ${chip.etiqueta}`}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 pl-3.5 pr-2.5 text-sm font-medium text-brand-700 transition-colors hover:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:h-9 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-200"
        >
          {chip.etiqueta}
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={limpiar}
          className="h-11 shrink-0 px-2 text-sm font-medium text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:h-9 dark:text-ink-400 dark:hover:text-white"
        >
          Limpiar todo
        </button>
      )}
    </div>
  )
}
