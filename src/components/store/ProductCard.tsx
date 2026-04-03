'use client'

import Image from 'next/image'
import Link from 'next/link'
import { calcularDescuento } from '@/lib/utils'
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

  const imagen = producto.imagenes[0] || ''
  const descuento = producto.precio_tachado
    ? calcularDescuento(producto.precio_venta, producto.precio_tachado)
    : 0

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
      <article className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-[0_0_15px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-card-hover dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_0_15px_rgba(255,255,255,0.02)]">
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden bg-white">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-600">
              <ShoppingCart className="h-12 w-12" aria-hidden="true" />
            </div>
          )}

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

          {/* Botón agregar al carrito (hover) */}
          <div className="absolute bottom-3 left-3 right-3 flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleAgregar}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                added
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-white/90 text-emerald-400 backdrop-blur hover:bg-white dark:bg-zinc-950/90 dark:hover:bg-zinc-950'
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
              <span className="rounded-lg bg-amber-400 px-2.5 py-1 font-mono text-xs font-bold text-zinc-950">
                -{descuento}%
              </span>
            )}
            {producto.destacado && (
              <span className="flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 font-mono text-xs font-bold text-white">
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                TOP
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            {producto.tags?.[0] || 'Producto'}
          </p>
          <h3 className="font-heading text-sm font-semibold leading-snug text-zinc-900 line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-400 transition-colors dark:text-zinc-100">
            {producto.nombre}
          </h3>
          <div className="mt-3 flex items-baseline gap-2">
            <Price amount={producto.precio_venta} className="font-mono text-xl font-bold text-emerald-400" />
            {producto.precio_tachado && (
              <Price amount={producto.precio_tachado} className="font-mono text-xs text-zinc-400 line-through dark:text-zinc-600" />
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
