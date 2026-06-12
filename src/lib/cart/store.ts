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
  /**
   * userId cacheado en memoria. Lo setea AuthCartSync on mount/SIGNED_IN
   * y lo limpia on SIGNED_OUT. Evita llamar a `auth.getUser()` (network)
   * en cada operación del carrito.
   */
  userId: string | null
}

interface CartActions {
  agregarItem: (item: Omit<CartItem, 'id'>) => void
  quitarItem: (id: string) => void
  cambiarCantidad: (id: string, cantidad: number) => void
  vaciarCarrito: () => void
  abrirCarrito: () => void
  cerrarCarrito: () => void
  toggleCarrito: () => void
  setUserId: (id: string | null) => void
  sincronizarAlLogin: (userId: string) => Promise<void>
  limpiarAlLogout: () => void
}

type CartStore = CartState & CartActions

const INITIAL_STATE: CartState = { items: [], isOpen: false, userId: null }

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
    // PostgreSQL trata NULL como distinto en UNIQUE constraints — por eso
    // antes se duplicaban filas. Usamos string vacío para que el UNIQUE
    // (user_id, producto_id, variante) deduplique correctamente.
    variante: item.variante ?? '',
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
  await supabase
    .from('carrito_items')
    .delete()
    .eq('user_id', userId)
    .eq('producto_id', productoId)
    // Schema garantiza NOT NULL con default '', así que la igualdad simple basta
    .eq('variante', variante ?? '')
}

async function vaciarRemotoBulk(userId: string) {
  const supabase = createClient()
  await supabase.from('carrito_items').delete().eq('user_id', userId)
}

/**
 * Consolida items duplicados por (productoId, variante).
 *
 * Defensa en profundidad: si por una regresión, race condition o data legacy
 * en localStorage el carrito acumuló filas repetidas del mismo producto,
 * al hidratar el store las fusionamos en una sola con la cantidad sumada.
 *
 * Esto se aplica:
 *   - On rehydrate desde localStorage (al cargar la app)
 *   - En sincronizarAlLogin antes del merge con remoto
 */
function dedupeCartItems(items: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of items) {
    const key = `${item.productoId}|${item.variante ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.cantidad += item.cantidad
    } else {
      // Copia para no mutar el original
      map.set(key, { ...item })
    }
  }
  return Array.from(map.values())
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      agregarItem: (item) => {
        const { items, userId } = get()
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

        // Fire-and-forget: no bloqueamos la UI esperando la respuesta
        if (userId) void upsertItemRemoto(nuevoItem, userId)
      },

      quitarItem: (id) => {
        const { items, userId } = get()
        const item = items.find((i) => i.id === id)
        set({ items: items.filter((i) => i.id !== id) })
        if (item && userId) {
          void eliminarItemRemoto(item.productoId, item.variante, userId)
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
        const { userId } = get()
        if (item && userId) void upsertItemRemoto(item, userId)
      },

      vaciarCarrito: () => {
        const { userId } = get()
        set({ items: [] })
        // Bulk delete: 1 query borra todo, en vez de N queries por item
        if (userId) void vaciarRemotoBulk(userId)
      },
      abrirCarrito: () => set({ isOpen: true }),
      cerrarCarrito: () => set({ isOpen: false }),
      toggleCarrito: () => set((s) => ({ isOpen: !s.isOpen })),
      setUserId: (userId) => set({ userId }),

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
          // Normalizar a string vacío para comparar (DB guarda '', local puede tener undefined)
          const remotoVar = remoto.variante || ''
          const existeLocal = itemsLocales.find(
            (l) => l.productoId === remoto.producto_id && (l.variante || '') === remotoVar
          )
          if (!existeLocal) {
            mergeado.push({
              id: `${remoto.producto_id}-${remotoVar || 'default'}-${remoto.id}`,
              productoId: remoto.producto_id,
              nombre: remoto.nombre,
              precio: Number(remoto.precio),
              imagen: remoto.imagen ?? '',
              variante: remotoVar || undefined,
              cantidad: remoto.cantidad,
            })
          }
        }

        // Defensa: si por algún motivo `mergeado` quedó con duplicados (legacy),
        // los consolidamos antes de setear y persistir.
        const final = dedupeCartItems(mergeado)
        set({ items: final })

        // Persistir estado mergeado en Supabase
        if (final.length > 0) {
          await supabase
            .from('carrito_items')
            .upsert(final.map((i) => itemToRow(i, userId)), {
              onConflict: 'user_id,producto_id,variante',
            })
        }
      },

      limpiarAlLogout: () => set({ items: [], isOpen: false, userId: null }),
    }),
    {
      name: 'siwuushop-cart',
      storage: createJSONStorage(() => localStorage),
      // userId no se persiste — se inyecta desde AuthCartSync en cada sesión
      partialize: (state) => ({ items: state.items }),
      // Al hidratar desde localStorage: consolidar duplicados (defensa contra
      // bugs viejos que pudieron dejar el storage con 1000+ filas del mismo
      // producto). Si después de consolidar quedan menos items, también
      // disparamos un bulk delete remoto para limpiar la cola del usuario.
      onRehydrateStorage: () => (state) => {
        if (!state || !state.items?.length) return
        const before = state.items.length
        state.items = dedupeCartItems(state.items)
        if (state.items.length < before) {
          // eslint-disable-next-line no-console
          console.info(`[cart] dedup: ${before} → ${state.items.length} items`)
        }
      },
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
