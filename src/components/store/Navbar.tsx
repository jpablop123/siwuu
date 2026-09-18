'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart, useCartCount } from '@/lib/cart/store'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserDropdown } from './UserDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { CurrencyToggle } from './CurrencyToggle'
import { Logo } from './Logo'
import { BarraBusqueda } from './busqueda/BarraBusqueda'

/**
 * Los enlaces cubren los dos modelos de negocio: el catálogo propio y el
 * encargo desde Estados Unidos.
 */
const NAV_LINKS = [
  { href: '/productos', label: 'Catálogo' },
  { href: '/pedido-usa', label: 'Pídelo de USA' },
  { href: '/#como-funciona', label: 'Cómo funciona' },
] as const

interface UserProfile {
  nombre: string
  email: string
  rol: string
}

/**
 * Header de la tienda.
 *
 * La búsqueda es la protagonista en todos los tamaños. En móvil, carrito y
 * cuenta ya viven en la barra inferior, así que salen del header para dejarle
 * el ancho a la búsqueda; moneda y modo día/noche pasan al menú, porque se
 * cambian una vez y no en cada visita.
 */
export function Navbar({ user }: { user?: UserProfile | null }) {
  const { abrirCarrito } = useCart()
  const count = useCartCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-ink-200 transition-shadow duration-200 dark:border-ink-800',
        scrolled ? 'glass shadow-card' : 'bg-white dark:bg-ink-950',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Siwuu — Inicio">
          <Logo className="h-7 w-auto sm:h-8" />
        </Link>

        {/* Navegación — solo desktop ancho */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {NAV_LINKS.map(({ href, label }) => {
            const base = href.split('#')[0]
            const isActive = base !== '/' && (pathname === base || pathname.startsWith(base + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Búsqueda — protagonista en todos los tamaños */}
        <BarraBusqueda className="flex-1 lg:max-w-md" />

        {/* Acciones — desde tablet; en móvil están en la barra inferior */}
        <div className="hidden items-center gap-1 md:flex">
          {user ? (
            <UserDropdown perfil={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="hidden whitespace-nowrap rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 xl:inline-flex"
              >
                Crear cuenta
              </Link>
            </>
          )}

          <CurrencyToggle />
          <ThemeToggle />

          <button
            type="button"
            onClick={abrirCarrito}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
            aria-label={`Abrir carrito${count > 0 ? `, ${count} productos` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-aduana-500 px-1 font-mono text-[10px] font-bold text-ink-900 ring-2 ring-white dark:ring-ink-950">
                {count}
              </span>
            )}
          </button>
        </div>

        {/* Menú — hasta desktop ancho */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-600 hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-ink-800"
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="menu-movil"
          className="animate-slide-in-up border-t border-ink-200 bg-white px-4 pb-6 pt-3 lg:hidden dark:border-ink-800 dark:bg-ink-950"
          aria-label="Menú"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/garantia"
              className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900"
            >
              Garantía y devoluciones
            </Link>
          </div>

          {/* Preferencias — en móvil no caben en el header */}
          <div className="mt-3 flex flex-col gap-3 border-t border-ink-200 px-4 pt-4 md:hidden dark:border-ink-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600 dark:text-ink-300">Moneda</span>
              <CurrencyToggle />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600 dark:text-ink-300">Modo</span>
              <ThemeToggle />
            </div>
          </div>

          {!user && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-xl border border-ink-200 text-sm font-semibold text-ink-900 dark:border-ink-700 dark:text-white"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="flex h-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
