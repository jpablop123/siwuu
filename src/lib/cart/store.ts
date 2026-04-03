'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEffect, useState } from 'react'
import type { CartItem } from '@/types'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

interface CartActions {
  agregarItem: (item: Omit<CartItem, 'id'>) => void
  quitarItem: (id: string) => void
  cambiarCantidad: (id: string, cantidad: number) => void
  vaciarCarrito: () => void
  abrirCarrito: () => void
  cerrarCarrito: () => void
  toggleCarrito: () => void
}

type CartStore = CartState & CartActions

// ---------------------------------------------------------------------------
// Estado inicial (lo que se renderiza en SSR antes de hidratar)
// ---------------------------------------------------------------------------

const INITIAL_STATE: CartState = {
  items: [],
  isOpen: false,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      agregarItem: (item) => {
        const { items } = get()
        const existente = items.find(
          (i) => i.productoId === item.productoId && i.variante === item.variante
        )

        if (existente) {
          set({
            items: items.map((i) =>
              i.id === existente.id
                ? { ...i, cantidad: i.cantidad + item.cantidad }
                : i
            ),
            isOpen: true,
          })
        } else {
          const id = `${item.productoId}-${item.variante ?? 'default'}-${Date.now()}`
          set({
            items: [...items, { ...item, id }],
            isOpen: true,
          })
        }
      },

      quitarItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      cambiarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().quitarItem(id)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, cantidad } : i
          ),
        })
      },

      vaciarCarrito: () => set({ items: [] }),
      abrirCarrito: () => set({ isOpen: true }),
      cerrarCarrito: () => set({ isOpen: false }),
      toggleCarrito: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'siwuushop-cart',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir items — isOpen es estado transitorio
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// ---------------------------------------------------------------------------
// Hook con protección contra hidratación
// ---------------------------------------------------------------------------
// Problema: Zustand con persist lee de localStorage tras el mount,
// lo que causa un mismatch entre el HTML del SSR (items=[]) y el
// HTML tras la hidratación (items=[...localStorage]).
//
// Solución: useCart() retorna el estado inicial durante el SSR y el
// primer render del cliente, y solo después de la hidratación usa
// el estado real del store (que ya tiene los datos de localStorage).
// ---------------------------------------------------------------------------

/**
 * Hook principal del carrito — SEGURO para SSR.
 * Retorna items=[] en el servidor y primer render,
 * y el estado real de localStorage después de montar.
 */
export function useCart() {
  const store = useCartStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return {
      ...store,
      // Sobreescribir datos que vienen de localStorage
      // con valores iniciales para que el SSR coincida
      items: INITIAL_STATE.items,
      isOpen: INITIAL_STATE.isOpen,
    }
  }

  return store
}

// ---------------------------------------------------------------------------
// Selectores computados — también protegidos contra hidratación
// ---------------------------------------------------------------------------

/**
 * Total del carrito en COP (suma de precio * cantidad por item).
 * Retorna 0 durante SSR.
 */
export function useCartTotal(): number {
  const { items } = useCart()
  return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
}

/**
 * Cantidad total de items en el carrito (suma de cantidades).
 * Retorna 0 durante SSR.
 */
export function useCartCount(): number {
  const { items } = useCart()
  return items.reduce((sum, item) => sum + item.cantidad, 0)
}
