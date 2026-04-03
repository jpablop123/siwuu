'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Package, MapPin, Lock, LogOut } from 'lucide-react'

const LINKS = [
  { href: '/cuenta', label: 'Mi perfil', icon: User },
  { href: '/cuenta/pedidos', label: 'Mis pedidos', icon: Package },
  { href: '/cuenta/direcciones', label: 'Mis direcciones', icon: MapPin },
  { href: '/cuenta/nueva-password', label: 'Cambiar contraseña', icon: Lock },
] as const

interface CuentaSidebarProps {
  perfil: { nombre: string; email: string }
}

export function CuentaSidebar({ perfil }: CuentaSidebarProps) {
  const pathname = usePathname()

  const iniciales = perfil.nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <aside>
      {/* Perfil */}
      <div className="mb-4 flex items-center gap-3 lg:mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400">
          {iniciales || 'U'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{perfil.nombre}</p>
          <p className="truncate text-xs text-zinc-500">{perfil.email}</p>
        </div>
      </div>

      {/* Nav mobile: scroll horizontal */}
      <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0" aria-label="Cuenta">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/cuenta'
              ? pathname === '/cuenta'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}

        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  )
}
