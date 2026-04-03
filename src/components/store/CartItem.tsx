'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Price } from './Price'
import { useCart } from '@/lib/cart/store'
import type { CartItem as CartItemType } from '@/types'

export function CartItemRow({ item }: { item: CartItemType }) {
  const { quitarItem, cambiarCantidad } = useCart()

  return (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {item.imagen && (
          <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="96px" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-medium">{item.nombre}</h3>
        {item.variante && <p className="text-sm text-zinc-500">{item.variante}</p>}
        <Price amount={item.precio} className="text-lg font-bold" />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2ch] text-center font-medium">{item.cantidad}</span>
        <button
          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="text-right">
        <Price amount={item.precio * item.cantidad} className="font-bold" />
        <button
          onClick={() => quitarItem(item.id)}
          className="mt-1 text-sm text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
