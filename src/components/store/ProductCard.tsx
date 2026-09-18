'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Check, Plus, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Price } from './Price'
import { OrigenBadge } from './OrigenBadge'
import { useCart } from '@/lib/cart/store'
import { useToast } from '@/components/ui/Toast'
import { CATALOGO_MIXTO } from '@/lib/encargos'
import type { Producto } from '@/types'

interface ProductCardProps {
  producto: Producto
  /** true en las primeras filas del grid: carga la foto sin esperar al scroll. */
  prioridad?: boolean
}

/**
 * Tarjeta de producto del catálogo.
 *
 * Reglas que la gobiernan:
 *  · El botón de agregar está SIEMPRE visible. En móvil no existe el hover, y
 *    esconder la acción principal detrás de un gesto que no ocurre es perder
 *    ventas en el 80% del tráfico.
 *  · El precio es el elemento más pesado después de la foto, y va en tinta:
 *    ponerle color lo abarata.
 *  · El único naranja es el badge de origen. El azul solo aparece cuando el
 *    usuario toca algo.
 *  · Cero hover tricks: el slider de imágenes por posición del mouse se quitó
 *    porque no ayuda a decidir, no existe en móvil y cargaba todas las fotos.
 */
export function ProductCard({ producto, prioridad = false }: ProductCardProps) {
  const { agregarItem } = useCart()
  const addToast = useToast((s) => s.addToast)
  const [added, setAdded] = useState(false)

  const imagen = producto.imagenes?.filter(Boolean)[0] ?? ''

  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimista: el carrito es estado local, así que confirma al instante.
    agregarItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_venta,
      imagen,
      cantidad: 1,
    })
    setAdded(true)
    addToast('Agregado al carrito')
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow duration-150 hover:shadow-[0_1px_3px_rgb(22_28_36_/_0.08),0_8px_24px_-12px_rgb(22_28_36_/_0.18)] dark:border-ink-800 dark:bg-ink-900">
      <Link
        href={`/productos/${producto.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {/* Foto — fondo blanco siempre, también de noche: los renders oficiales
            vienen recortados sobre blanco */}
        <div className="relative aspect-square overflow-hidden bg-white">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              priority={prioridad}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300">
              <ShoppingCart className="h-10 w-10" aria-hidden="true" />
            </div>
          )}

          {/* Solo cuando el catálogo mezcla local e importado: si todo viene de
              USA, el badge en las 24 tarjetas es ruido, no información */}
          {CATALOGO_MIXTO && <OrigenBadge className="absolute left-2.5 top-2.5" />}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink-800 dark:text-ink-100">
            {producto.nombre}
          </h3>

          <div className="mt-auto flex items-baseline gap-2">
            <Price
              amount={producto.precio_venta}
              className="font-heading text-lg font-extrabold tracking-[-0.02em] text-ink-900 tabular-nums dark:text-white sm:text-xl"
            />
            {producto.precio_tachado && (
              <Price
                amount={producto.precio_tachado}
                className="text-xs text-ink-400 line-through dark:text-ink-500"
              />
            )}
          </div>
        </div>
      </Link>

      {/* Acción — siempre visible, 44px de alto, azul solo al tocar */}
      <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5">
        <button
          type="button"
          onClick={handleAgregar}
          aria-label={`Agregar ${producto.nombre} al carrito`}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-900',
            added
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-ink-200 bg-white text-ink-900 hover:border-brand-500 hover:bg-brand-500 hover:text-white active:bg-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-white',
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Agregado
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar
            </>
          )}
        </button>
      </div>
    </article>
  )
}
