'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { RANGOS_PRECIO, pesosCortos } from '@/lib/catalogo'
import { useFiltros } from './FiltrosProvider'

/**
 * Los filtros en sí. El mismo contenido va en el sidebar de desktop y en la
 * hoja inferior de móvil, así que nunca se desalinean.
 *
 * Cada toque aplica de inmediato: no hay botón de "Aplicar" para categoría ni
 * para rangos de precio. El único formulario es el precio libre, porque ahí sí
 * hay que terminar de escribir antes de buscar.
 */
export function PanelFiltros() {
  const { filtros, aplicar, categorias } = useFiltros()

  const [min, setMin] = useState(filtros.precio_min ?? '')
  const [max, setMax] = useState(filtros.precio_max ?? '')

  // Si el precio cambia desde afuera (un chip, un rango), los campos lo siguen.
  useEffect(() => {
    setMin(filtros.precio_min ?? '')
    setMax(filtros.precio_max ?? '')
  }, [filtros.precio_min, filtros.precio_max])

  const rangoActivo = RANGOS_PRECIO.find(
    (r) =>
      (r.min ? String(r.min) : undefined) === filtros.precio_min &&
      (r.max ? String(r.max) : undefined) === filtros.precio_max,
  )

  // Se guarda solo en dígitos, pero se muestra con puntos: "5000000" no se lee.
  const conPuntos = (digitos: string) => (digitos ? Number(digitos).toLocaleString('es-CO') : '')

  const opcion = (activa: boolean) =>
    cn(
      'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm transition-colors duration-100 lg:min-h-9',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
      activa
        ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
        : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800',
    )

  const titulo = 'mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400'

  return (
    <div className="flex flex-col gap-7">
      {/* Categoría */}
      <fieldset>
        <legend className={titulo}>Categoría</legend>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => aplicar({ categoria: undefined })}
            aria-pressed={!filtros.categoria}
            className={opcion(!filtros.categoria)}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => aplicar({ categoria: cat.slug })}
              aria-pressed={filtros.categoria === cat.slug}
              className={opcion(filtros.categoria === cat.slug)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Precio */}
      <fieldset>
        <legend className={titulo}>Precio</legend>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-0.5">
          {RANGOS_PRECIO.map((r) => {
            const activo = rangoActivo?.id === r.id
            const etiqueta =
              r.min && r.max
                ? `${pesosCortos(r.min)} – ${pesosCortos(r.max)}`
                : r.min
                  ? `Más de ${pesosCortos(r.min)}`
                  : `Hasta ${pesosCortos(r.max!)}`
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={activo}
                onClick={() =>
                  activo
                    ? aplicar({ precio_min: undefined, precio_max: undefined })
                    : aplicar({
                        precio_min: r.min ? String(r.min) : undefined,
                        precio_max: r.max ? String(r.max) : undefined,
                      })
                }
                className={cn(
                  opcion(activo),
                  'justify-center border border-ink-200 lg:justify-start lg:border-transparent dark:border-ink-700',
                  activo && 'border-brand-200 dark:border-brand-500/40',
                )}
              >
                {etiqueta}
              </button>
            )
          })}
        </div>

        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            aplicar({ precio_min: min || undefined, precio_max: max || undefined })
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Precio mínimo en pesos</span>
            <input
              id="filtro-precio-min"
              type="text"
              inputMode="numeric"
              placeholder="Mínimo"
              value={conPuntos(min)}
              onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 lg:h-9 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Precio máximo en pesos</span>
            <input
              id="filtro-precio-max"
              type="text"
              inputMode="numeric"
              placeholder="Máximo"
              value={conPuntos(max)}
              onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 lg:h-9 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-lg border border-brand-500 px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:h-9 dark:text-brand-300"
          >
            Ir
          </button>
        </form>
      </fieldset>
    </div>
  )
}
