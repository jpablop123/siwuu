'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  sincronizarAlLogin: (userId: string) => Promise<void>
  limpiarAlLogout: () => void
}

type CartStore = CartState & CartActions

const INITIAL_STATE: CartState = { items: [], isOpen: false }

// ---------------------------------------------------------------------------
// Helpers Supabase — sync en background
// ---------------------------------------------------------------------------

function itemToRow(item: CartItem, userId: string) {
  return {
    user_id: userId,
    producto_id: item.productoId,
    nombre: item.nombre,
    precio: item.precio,
    imagen: item.imagen,
    variante: item.variante ?? null,
    cantidad: item.cantidad,
  }
}

async function upsertItemRemoto(item: CartItem, userId: string) {
  const supabase = createClient()
  await supabase.from('carrito_items').upsert(itemToRow(item, userId), {
    onConflict: 'user_id,producto_id,variante',
  })
}

async function eliminarItemRemoto(productoId: string, variante: string | undefined, userId: string) {
  const supabase = createClient()
  let query = supabase
    .from('carrito_items')
    .delete()
    .eq('user_id', userId)
    .eq('producto_id', productoId)

  if (variante) {
    query = query.eq('variante', variante)
  } else {
    query = query.is('variante', null)
  }

  await query
}

function syncConUsuario(fn: (userId: string) => void) {
  createClient()
    .auth.getUser()
    .then(({ data }) => { if (data.user) fn(data.user.id) })
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

        let nuevoItem: CartItem
        if (existente) {
          nuevoItem = { ...existente, cantidad: existente.cantidad + item.cantidad }
          set({
            items: items.map((i) => i.id === existente.id ? nuevoItem : i),
            isOpen: true,
          })
        } else {
          nuevoItem = {
            ...item,
            id: `${item.productoId}-${item.variante ?? 'default'}-${Date.now()}`,
          }
          set({ items: [...items, nuevoItem], isOpen: true })
        }

        syncConUsuario((uid) => upsertItemRemoto(nuevoItem, uid))
      },

      quitarItem: (id) => {
        const item = get().items.find((i) => i.id === id)
        set({ items: get().items.filter((i) => i.id !== id) })
        if (item) {
          syncConUsuario((uid) => eliminarItemRemoto(item.productoId, item.variante, uid))
        }
      },

      cambiarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().quitarItem(id)
          return
        }
        const items = get().items.map((i) => i.id === id ? { ...i, cantidad } : i)
        set({ items })
        const item = items.find((i) => i.id === id)
        if (item) syncConUsuario((uid) => upsertItemRemoto(item, uid))
      },

      vaciarCarrito: () => set({ items: [] }),
      abrirCarrito: () => set({ isOpen: true }),
      cerrarCarrito: () => set({ isOpen: false }),
      toggleCarrito: () => set((s) => ({ isOpen: !s.isOpen })),

      // Al login: merge carrito local (prioridad) con Supabase
      sincronizarAlLogin: async (userId) => {
        const supabase = createClient()
        const itemsLocales = get().items

        const { data: itemsRemotos } = await supabase
          .from('carrito_items')
          .select('*')
          .eq('user_id', userId)

        if (!itemsRemotos) return

        const mergeado: CartItem[] = [...itemsLocales]

        for (const remoto of itemsRemotos) {
          const existeLocal = itemsLocales.find(
            (l) => l.productoId === remoto.producto_id &&
              (l.variante ?? null) === (remoto.variante ?? null)
          )
          if (!existeLocal) {
            mergeado.push({
              id: `${remoto.producto_id}-${remoto.variante ?? 'default'}-${remoto.id}`,
              productoId: remoto.producto_id,
              nombre: remoto.nombre,
              precio: Number(remoto.precio),
              imagen: remoto.imagen ?? '',
              variante: remoto.variante ?? undefined,
              cantidad: remoto.cantidad,
            })
          }
        }

        set({ items: mergeado })

        // Persistir estado mergeado en Supabase
        if (mergeado.length > 0) {
          await supabase
            .from('carrito_items')
            .upsert(mergeado.map((i) => itemToRow(i, userId)), {
              onConflict: 'user_id,producto_id,variante',
            })
        }
      },

      limpiarAlLogout: () => set({ items: [], isOpen: false }),
    }),
    {
      name: 'siwuushop-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// ---------------------------------------------------------------------------
// Hook con protección contra hidratación
// ---------------------------------------------------------------------------

export function useCart() {
  const store = useCartStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) {
    return { ...store, items: INITIAL_STATE.items, isOpen: INITIAL_STATE.isOpen }
  }

  return store
}

export function useCartTotal(): number {
  const { items } = useCart()
  return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
}

export function useCartCount(): number {
  const { items } = useCart()
  return items.reduce((sum, item) => sum + item.cantidad, 0)
}
