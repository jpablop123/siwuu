'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ShoppingCart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Price } from './Price'
import { useCart } from '@/lib/cart/store'
import { useToast } from '@/components/ui/Toast'
import {
  agruparVariantes,
  faltanOpciones,
  precioConVariantes,
  seleccionInicial,
  textoVariante,
} from '@/lib/variantes'
import type { Producto, Variante } from '@/types'

interface Props {
  producto: Producto
  variantes: Variante[]
  onCerrar: () => void
}

/**
 * Selector rápido de opciones desde el catálogo.
 *
 * Antes, el botón "Agregar" de la tarjeta metía el producto sin color ni
 * capacidad y al precio base. Eso rompía dos cosas: el cliente pagaba de menos
 * por un 512 GB, y el pedido llegaba sin decir qué equipo comprar en Estados
 * Unidos.
 *
 * Se abre como hoja inferior en móvil y como diálogo centrado en desktop, con
 * las opciones ya preseleccionadas para que agregar siga siendo un toque más.
 */
export function SelectorRapido({ producto, variantes, onCerrar }: Props) {
  const { agregarItem } = useCart()
  const addToast = useToast((s) => s.addToast)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  const grupos = useMemo(() => agruparVariantes(variantes), [variantes])
  const [seleccionadas, setSeleccionadas] = useState(() => seleccionInicial(grupos))

  const precio = precioConVariantes(producto.precio_venta, seleccionadas, grupos)
  const incompleto = faltanOpciones(grupos, seleccionadas)
  const imagen = producto.imagenes?.filter(Boolean)[0] ?? ''

  useEffect(() => {
    cerrarRef.current?.focus()
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', onKey)
    }
  }, [onCerrar])

  const agregar = () => {
    if (incompleto) {
      addToast('Elige todas las opciones', 'error')
      return
    }
    agregarItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio,
      imagen,
      variante: textoVariante(seleccionadas),
      cantidad: 1,
    })
    addToast('Agregado al carrito')
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="selector-titulo">
      <button
        type="button"
        onClick={onCerrar}
        tabIndex={-1}
        aria-label="Cerrar"
        className="absolute inset-0 h-full w-full bg-ink-950/50"
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] animate-slide-in-up flex-col rounded-t-2xl bg-white sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-2xl dark:bg-ink-900">
        <div className="flex items-start gap-3 border-b border-ink-200 p-4 dark:border-ink-800">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-700">
            {imagen && <Image src={imagen} alt="" fill sizes="64px" className="object-contain p-1" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="selector-titulo" className="line-clamp-2 font-heading text-base font-bold text-ink-900 dark:text-white">
              {producto.nombre}
            </h2>
            <Price
              amount={precio}
              className="mt-1 block font-heading text-lg font-extrabold tabular-nums text-ink-900 dark:text-white"
            />
          </div>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {Object.entries(grupos).map(([nombre, opciones]) => (
            <fieldset key={nombre} className="mb-5 last:mb-0">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {nombre}
              </legend>
              <div className="flex flex-wrap gap-2">
                {opciones.map((opcion) => {
                  const activa = seleccionadas[nombre] === opcion.valor
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      disabled={!opcion.disponible}
                      aria-pressed={activa}
                      onClick={() => setSeleccionadas((prev) => ({ ...prev, [nombre]: opcion.valor }))}
                      className={cn(
                        'flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        'disabled:cursor-not-allowed disabled:opacity-40',
                        activa
                          ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                          : 'border-ink-200 text-ink-800 hover:border-ink-400 dark:border-ink-700 dark:text-ink-100',
                      )}
                    >
                      {opcion.valor}
                      {opcion.precio_adicional > 0 && (
                        <span className="text-xs text-ink-500 dark:text-ink-400">
                          +<Price amount={opcion.precio_adicional} className="tabular-nums" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <Link
            href={`/productos/${producto.slug}`}
            className="mt-1 inline-block text-sm font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-300"
          >
            Ver todos los detalles
          </Link>
        </div>

        <div className="border-t border-ink-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] dark:border-ink-800">
          <button
            type="button"
            onClick={agregar}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Agregar al carrito
          </button>
          {incompleto && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Elige todas las opciones para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
