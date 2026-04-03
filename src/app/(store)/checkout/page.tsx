'use client'

import { CheckoutForm } from '@/components/store/CheckoutForm'
import { useCart } from '@/lib/cart/store'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function CheckoutPage() {
  const { items } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20">
        <ShoppingBag className="h-20 w-20 text-zinc-400 dark:text-zinc-600" />
        <h1 className="mt-4 text-2xl font-bold">No hay productos en tu carrito</h1>
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
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Checkout</h1>
      <CheckoutForm />
    </div>
  )
}
