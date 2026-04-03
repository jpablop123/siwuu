'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface BusquedaClientesProps {
  valorInicial?: string
}

export function BusquedaClientes({ valorInicial }: BusquedaClientesProps) {
  const router = useRouter()
  const [q, setQ] = useState(valorInicial || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    const qs = params.toString()
    router.push(`/admin/clientes${qs ? `?${qs}` : ''}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o teléfono..."
        className="w-full rounded-lg border border-zinc-200 bg-zinc-100 py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        aria-label="Buscar clientes"
      />
    </form>
  )
}
