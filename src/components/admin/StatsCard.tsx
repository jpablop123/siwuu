import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  titulo: string
  valor: string | number
  icono: ReactNode
  descripcion?: string
  alerta?: boolean
  colorIcono?: string
}

export function StatsCard({
  titulo,
  valor,
  icono,
  descripcion,
  alerta,
  colorIcono = 'bg-indigo-100 text-indigo-600',
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm',
        alerta ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            colorIcono
          )}
        >
          {icono}
        </div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{titulo}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{valor}</p>
      {descripcion && <p className="mt-1 text-xs text-zinc-500">{descripcion}</p>}
    </div>
  )
}
