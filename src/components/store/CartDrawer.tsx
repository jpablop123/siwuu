'use client'

import { useCart, useCartTotal, useCartCount } from '@/lib/cart/store'
import { COSTO_ENVIO, COSTO_ENVIO_GRATIS_DESDE } from '@/lib/utils'
import { Price } from './Price'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

export function CartDrawer() {
  const { items, isOpen, cerrarCarrito, quitarItem, cambiarCantidad } = useCart()
  const total = useCartTotal()
  const count = useCartCount()
  const envio = total >= COSTO_ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO
  const faltaParaGratis = COSTO_ENVIO_GRATIS_DESDE - total
  const porcentajeGratis = Math.min((total / COSTO_ENVIO_GRATIS_DESDE) * 100, 100)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={cerrarCarrito}
      />

      {/* Drawer */}
      <div className="relative flex w-full max-w-md flex-col bg-zinc-50 shadow-2xl animate-slide-in-right dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold">Tu carrito</h2>
              <p className="text-xs text-zinc-500">{count} {count === 1 ? 'producto' : 'productos'}</p>
            </div>
          </div>
          <button
            onClick={cerrarCarrito}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && faltaParaGratis > 0 && (
          <div className="border-b border-zinc-200 bg-amber-50 px-6 py-3 dark:border-zinc-700 dark:bg-amber-900/30">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-300">
                Agrega <strong><Price amount={faltaParaGratis} /></strong> más para envío gratis
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-900/50">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${porcentajeGratis}%` }}
              />
            </div>
          </div>
        )}

        {items.length > 0 && faltaParaGratis <= 0 && (
          <div className="flex items-center gap-2 border-b border-zinc-200 bg-green-50 px-6 py-3 text-xs text-green-600 dark:border-zinc-700 dark:bg-green-900/30 dark:text-green-400">
            <Sparkles className="h-3.5 w-3.5" />
            <strong>Tienes envío gratis!</strong>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <ShoppingBag className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-zinc-500">Descubre productos increíbles</p>
            </div>
            <Link
              href="/productos"
              onClick={cerrarCarrito}
              className="rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl bg-zinc-100 p-3 transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200 shadow-sm dark:bg-zinc-900">
                      {item.imagen && (
                        <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="80px" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-medium leading-tight line-clamp-1">{item.nombre}</h4>
                        {item.variante && (
                          <p className="mt-0.5 text-xs text-zinc-500">{item.variante}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[2ch] text-center text-sm font-medium">{item.cantidad}</span>
                          <button
                            onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold"><Price amount={item.precio * item.cantidad} /></span>
                          <button
                            onClick={() => quitarItem(item.id)}
                            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-900/30 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 bg-white p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-zinc-700 dark:bg-zinc-900">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <Price amount={total} />
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Envío</span>
                  <span className={envio === 0 ? 'font-medium text-green-600' : ''}>
                    {envio === 0 ? 'GRATIS' : <Price amount={envio} />}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold dark:border-zinc-700">
                  <span>Total</span>
                  <Price amount={total + envio} />
                </div>
              </div>
              <Link
                href="/checkout"
                onClick={cerrarCarrito}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                Ir al checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
