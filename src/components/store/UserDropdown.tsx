'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, Package, LogOut, Zap, ChevronDown } from 'lucide-react'

interface UserProfile {
  nombre: string
  email: string
  rol: string
}

export function UserDropdown({ perfil }: { perfil: UserProfile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const initials = perfil.nombre
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-2 py-1.5 transition-all hover:border-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
          {initials}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform dark:text-zinc-500 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 animate-fade-in-up rounded-xl border-2 border-zinc-200 bg-white p-1 shadow-[0_0_30px_0_rgba(0,0,0,0.15)] dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-[0_0_30px_0_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-700">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{perfil.nombre}</p>
            <p className="mt-0.5 font-mono text-xs text-zinc-500">{perfil.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 dark:text-zinc-300"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Mi Perfil
            </Link>
            <Link
              href="/cuenta/pedidos"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 dark:text-zinc-300"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Mis Pedidos
            </Link>

            {perfil.rol === 'admin' && (
              <>
                <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-violet-400 transition-colors hover:bg-violet-500/10"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Panel Admin
                </Link>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-200 pt-1 dark:border-zinc-700">
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/'
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
