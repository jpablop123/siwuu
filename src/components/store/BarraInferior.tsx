'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingCart, User } from 'lucide-react'
import { useCart, useCartCount } from '@/lib/cart/store'
import { cn } from '@/lib/utils'
import { useBuscador } from './busqueda/BusquedaProvider'

/**
 * Barra inferior fija — solo móvil.
 *
 * El 80% del tráfico es móvil, y en móvil el pulgar vive abajo. Las cuatro
 * acciones que la gente repite (volver al inicio, buscar, ver el carrito,
 * entrar a la cuenta) dejan de estar escondidas detrás de la hamburguesa.
 *
 * El carrito abre el drawer y Buscar abre el buscador, en vez de navegar:
 * sacar a alguien de donde está para mostrarle algo es perder el hilo.
 */
export function BarraInferior() {
  const pathname = usePathname()
  const { abrirCarrito } = useCart()
  const count = useCartCount()
  const { abrir: abrirBuscador } = useBuscador()

  const activo = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium'
  const off = 'text-ink-500 dark:text-ink-400'
  const on = 'text-brand-600 dark:text-brand-400'

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden dark:border-ink-800 dark:bg-ink-950"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch">
        <Link href="/" className={cn(item, activo('/') ? on : off)} aria-current={activo('/') ? 'page' : undefined}>
          <Home className="h-5 w-5" aria-hidden="true" />
          Inicio
        </Link>

        {/* Abre el buscador, no una página: buscar es escribir, no navegar */}
        <button type="button" onClick={() => abrirBuscador()} className={cn(item, off)} aria-haspopup="dialog">
          <Search className="h-5 w-5" aria-hidden="true" />
          Buscar
        </button>

        <button
          type="button"
          onClick={abrirCarrito}
          className={cn(item, off, 'relative')}
          aria-label={`Abrir carrito${count > 0 ? `, ${count} productos` : ''}`}
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aduana-500 px-1 font-mono text-[9px] font-bold text-ink-900">
                {count}
              </span>
            )}
          </span>
          Carrito
        </button>

        <Link
          href="/cuenta"
          className={cn(item, activo('/cuenta') ? on : off)}
          aria-current={activo('/cuenta') ? 'page' : undefined}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          Cuenta
        </Link>
      </div>
    </nav>
  )
}
