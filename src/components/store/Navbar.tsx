'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react'
import { useCart, useCartCount } from '@/lib/cart/store'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserDropdown } from './UserDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { CurrencyToggle } from './CurrencyToggle'
import { Logo } from './Logo'

const NAV_LINKS = [
  { href: '/productos', label: 'Productos' },
] as const

interface UserProfile {
  nombre: string
  email: string
  rol: string
}

export function Navbar({ user }: { user?: UserProfile | null }) {
  const { abrirCarrito } = useCart()
  const count = useCartCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar menú mobile al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = search.trim()
      if (q) {
        router.push(`/productos?q=${encodeURIComponent(q)}`)
        setSearch('')
        setMenuOpen(false)
      }
    },
    [search, router]
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-emerald-500/20 bg-white/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/60'
          : 'border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950'
      )}
    >
<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="Siwuu — Inicio">
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400',
                  'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-emerald-500 after:transition-all after:duration-200',
                  isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Busqueda desktop */}
          <form onSubmit={handleSearch} className="hidden sm:block" role="search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-44 rounded-xl border border-zinc-200 bg-zinc-100 py-2 pl-9 pr-4 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:w-60 focus:border-emerald-500/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20 lg:w-52 lg:focus:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
                aria-label="Buscar productos"
              />
            </div>
          </form>

          {/* Auth section */}
          {user ? (
            <UserDropdown perfil={user} />
          ) : (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-600 hover:text-white"
                >
                  Registrarme
                </Link>
              </div>
              <Link
                href="/login"
                className="rounded-xl p-2.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-emerald-400 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Iniciar sesión"
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
            </>
          )}

          <CurrencyToggle />
          <ThemeToggle />

          <button
            type="button"
            onClick={abrirCarrito}
            className="relative rounded-xl p-2.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
            aria-label={`Abrir carrito${count > 0 ? `, ${count} productos` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 font-mono text-[10px] font-bold text-zinc-950 ring-2 ring-white dark:ring-zinc-950 animate-bounce-subtle">
                {count}
              </span>
            )}
          </button>

          {/* Hamburguesa mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl p-2.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="animate-slide-in-up border-t border-zinc-200 bg-white px-4 pb-6 pt-4 md:hidden dark:border-zinc-700 dark:bg-zinc-950"
          aria-label="Navegacion mobile"
        >
          {/* Busqueda mobile */}
          <form onSubmit={handleSearch} className="mb-4 sm:hidden" role="search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 pl-9 pr-4 text-sm text-zinc-900 focus:border-emerald-500/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
                aria-label="Buscar productos"
              />
            </div>
          </form>

          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              )
            })}

            {/* Mobile auth links */}
            {!user && (
              <>
                <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
