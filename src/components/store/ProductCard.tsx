'use client'

import Image from 'next/image'
import Link from 'next/link'
import { calcularDescuento, cn } from '@/lib/utils'
import { Price } from './Price'
import { useCart } from '@/lib/cart/store'
import { useToast } from '@/components/ui/Toast'
import { ShoppingCart, Star } from 'lucide-react'
import type { Producto } from '@/types'
import { useState } from 'react'

interface ProductCardProps {
  producto: Producto
}

export function ProductCard({ producto }: ProductCardProps) {
  const { agregarItem } = useCart()
  const addToast = useToast((s) => s.addToast)
  const [added, setAdded] = useState(false)

  const imagenes = producto.imagenes?.filter(Boolean) ?? []
  const imagen = imagenes[0] || ''
  const tieneVarias = imagenes.length > 1
  const [idx, setIdx] = useState(0)
  const descuento = producto.precio_tachado
    ? calcularDescuento(producto.precio_venta, producto.precio_tachado)
    : 0

  // Slider con el mouse: la posición horizontal del cursor elige la imagen.
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tieneVarias) return
    const r = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - r.left) / r.width
    setIdx(Math.min(imagenes.length - 1, Math.max(0, Math.floor(pct * imagenes.length))))
  }

  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    agregarItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_venta,
      imagen,
      cantidad: 1,
    })
    setAdded(true)
    addToast('Producto agregado al carrito')
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/productos/${producto.slug}`} className="group">
      <article className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {/* Imagen */}
        {/* Contenedor siempre bg-white — fotos con fondo blanco se ven como catálogo profesional en dark mode */}
        <div
          className="relative aspect-square overflow-hidden bg-white"
          onMouseMove={handleMove}
          onMouseLeave={() => setIdx(0)}
        >
          {imagenes.length ? (
            imagenes.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`${producto.nombre} — imagen ${i + 1}`}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  i === idx ? 'opacity-100' : 'opacity-0'
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-600">
              <ShoppingCart className="h-12 w-12" aria-hidden="true" />
            </div>
          )}

          {/* Indicadores del slider (visibles al pasar el mouse) */}
          {tieneVarias && (
            <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {imagenes.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-200',
                    i === idx ? 'w-5 bg-zinc-900/80 dark:bg-white' : 'w-2.5 bg-zinc-900/25 dark:bg-white/40'
                  )}
                />
              ))}
            </div>
          )}

          {/* Overlay hover */}
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          {/* Botón agregar al carrito (hover) */}
          <div className="absolute bottom-3 left-3 right-3 flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleAgregar}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                added
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-white/95 text-emerald-700 backdrop-blur hover:bg-white dark:bg-zinc-950/90 dark:text-emerald-400 dark:hover:bg-zinc-950'
              }`}
              aria-label={added ? 'Agregado al carrito' : `Agregar ${producto.nombre} al carrito`}
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
              {added ? 'Agregado!' : 'Agregar'}
            </button>
          </div>

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {descuento > 0 && (
              <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-zinc-950">
                -{descuento}%
              </span>
            )}
            {producto.destacado && (
              <span className="flex items-center gap-1 rounded-lg bg-zinc-900/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur dark:bg-white/90 dark:text-zinc-900">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                Destacado
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {producto.tags?.[0] || 'Producto'}
          </p>
          <h3 className="font-heading text-sm font-semibold leading-snug text-zinc-900 line-clamp-2 min-h-[2.5rem] transition-colors group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-400">
            {producto.nombre}
          </h3>
          <div className="mt-3 flex items-baseline gap-2">
            <Price amount={producto.precio_venta} className="text-lg font-bold text-zinc-900 dark:text-zinc-50" />
            {producto.precio_tachado && (
              <Price amount={producto.precio_tachado} className="text-xs text-zinc-400 line-through dark:text-zinc-600" />
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
