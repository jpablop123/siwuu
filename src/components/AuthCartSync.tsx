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
  const { setUserId, sincronizarAlLogin, limpiarAlLogout } = useCartStore()

  useEffect(() => {
    const supabase = createClient()

    // Sincronizar si ya hay sesión al montar
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id)         // cachear en store
        sincronizarAlLogin(data.session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id)
        sincronizarAlLogin(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        limpiarAlLogout()                       // ya pone userId: null
      }
    })

    return () => subscription.unsubscribe()
  }, [setUserId, sincronizarAlLogin, limpiarAlLogout])

  return null
}
