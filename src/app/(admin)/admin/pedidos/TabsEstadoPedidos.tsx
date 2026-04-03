'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'urgentes', label: 'Urgentes' },
  { key: 'procesando', label: 'Procesando' },
  { key: 'enviado_proveedor', label: 'Enviados' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
] as const

interface TabsEstadoPedidosProps {
  estadoActual: string
  conteos: Record<string, number>
}

export function TabsEstadoPedidos({ estadoActual, conteos }: TabsEstadoPedidosProps) {
  const router = useRouter()

  const getConteo = (key: string) => {
    if (key === 'todos') return Object.values(conteos).reduce((a, b) => a + b, 0)
    if (key === 'urgentes') return (conteos['pendiente'] || 0) + (conteos['pago_confirmado'] || 0)
    return conteos[key] || 0
  }

  const handleClick = (key: string) => {
    const params = key === 'todos' ? '' : `?estado=${key}`
    router.push(`/admin/pedidos${params}`)
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0 sm:pb-0">
      {TABS.map((tab) => {
        const count = getConteo(tab.key)
        const isActive = estadoActual === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-500 text-zinc-950'
                : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            )}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.key === 'urgentes' && count > 0
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
