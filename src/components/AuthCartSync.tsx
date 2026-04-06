'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/cart/store'

/**
 * Escucha cambios de sesión y sincroniza el carrito Zustand con Supabase.
 * - SIGNED_IN → merge carrito local con remoto
 * - SIGNED_OUT → limpiar carrito local
 * Renderiza null — es solo un efecto de sincronización.
 */
export function AuthCartSync() {
  const { sincronizarAlLogin, limpiarAlLogout } = useCartStore()

  useEffect(() => {
    const supabase = createClient()

    // Sincronizar si ya hay sesión al montar
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        sincronizarAlLogin(data.session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        sincronizarAlLogin(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        limpiarAlLogout()
      }
    })

    return () => subscription.unsubscribe()
  }, [sincronizarAlLogin, limpiarAlLogout])

  return null
}
