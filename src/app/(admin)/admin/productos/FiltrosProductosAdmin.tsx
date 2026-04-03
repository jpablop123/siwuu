'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface FiltrosProductosAdminProps {
  categorias: Array<{ id: string; nombre: string; slug: string }>
  proveedores: Array<{ id: string; nombre: string }>
  filtrosActuales: {
    q?: string
    categoria?: string
    proveedor?: string
    activo?: string
  }
}

export function FiltrosProductosAdmin({
  categorias,
  proveedores,
  filtrosActuales,
}: FiltrosProductosAdminProps) {
  const router = useRouter()
  const [q, setQ] = useState(filtrosActuales.q || '')

  function navigate(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { ...filtrosActuales, ...overrides, page: undefined }
    for (const [key, val] of Object.entries(merged)) {
      if (val) params.set(key, val)
    }
    const qs = params.toString()
    router.push(`/admin/productos${qs ? `?${qs}` : ''}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ q: q.trim() || undefined })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-100 py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:w-56"
          aria-label="Buscar productos"
        />
      </form>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <select
          value={filtrosActuales.categoria || ''}
          onChange={(e) => navigate({ categoria: e.target.value || undefined })}
          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="Filtrar por categoría"
        >
          <option value="">Categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={filtrosActuales.proveedor || ''}
          onChange={(e) => navigate({ proveedor: e.target.value || undefined })}
          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="Filtrar por proveedor"
        >
          <option value="">Proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <select
          value={filtrosActuales.activo || ''}
          onChange={(e) => navigate({ activo: e.target.value || undefined })}
          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="Filtrar por estado"
        >
          <option value="">Estado</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>
    </div>
  )
}
