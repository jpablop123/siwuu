'use client'

import { useCart, useCartTotal } from '@/lib/cart/store'
import { COSTO_ENVIO, COSTO_ENVIO_GRATIS_DESDE } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import { CartItemRow } from '@/components/store/CartItem'
import { Button } from '@/components/ui/Button'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function CarritoPage() {
  const { items, vaciarCarrito } = useCart()
  const subtotal = useCartTotal()
  const envio = subtotal >= COSTO_ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO
  const total = subtotal + envio

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20">
        <ShoppingBag className="h-20 w-20 text-zinc-400 dark:text-zinc-600" />
        <h1 className="mt-4 text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="mt-2 text-zinc-500">Agrega productos para empezar a comprar</p>
        <Link
          href="/productos"
          className="mt-6 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Tu carrito</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
          <button
            onClick={vaciarCarrito}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-6 h-fit dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
              <Price amount={subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Envío</span>
              <span>{envio === 0 ? 'GRATIS' : <Price amount={envio} />}</span>
            </div>
            {envio > 0 && (
              <p className="text-xs text-green-600">
                Envío gratis desde <Price amount={COSTO_ENVIO_GRATIS_DESDE} />
              </p>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold dark:border-zinc-700">
              <span>Total</span>
              <Price amount={total} />
            </div>
          </div>
          <Link href="/checkout">
            <Button size="lg" className="mt-6 w-full">
              Ir al checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
