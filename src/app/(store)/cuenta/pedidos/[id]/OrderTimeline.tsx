import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import type { EstadoPedido } from '@/types'

const PASOS = [
  { key: 'pago_confirmado', label: 'Pago confirmado' },
  { key: 'procesando', label: 'Procesando' },
  { key: 'enviado_proveedor', label: 'Enviado al proveedor' },
  { key: 'en_camino', label: 'En camino' },
  { key: 'entregado', label: 'Entregado' },
] as const

const INDICE_ESTADO: Record<string, number> = {
  pago_confirmado: 0,
  procesando: 1,
  enviado_proveedor: 2,
  en_camino: 3,
  entregado: 4,
}

interface OrderTimelineProps {
  estado: EstadoPedido
}

export function OrderTimeline({ estado }: OrderTimelineProps) {
  const cancelado = estado === 'cancelado'
  const pendiente = estado === 'pendiente'
  const activeIndex = INDICE_ESTADO[estado] ?? -1

  return (
    <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
      {PASOS.map((paso, i) => {
        const completado = !cancelado && !pendiente && i < activeIndex
        const activo = !cancelado && !pendiente && i === activeIndex

        return (
          <div key={paso.key} className="flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2">
            {/* Círculo + línea */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  cancelado
                    ? 'bg-red-100 text-red-600'
                    : completado
                      ? 'bg-green-500 text-white'
                      : activo
                        ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/15'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                )}
              >
                {cancelado ? (
                  <X className="h-4 w-4" aria-hidden="true" />
                ) : completado ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Línea conectora (mobile: vertical, desktop: oculta) */}
              {i < PASOS.length - 1 && (
                <div
                  className={cn(
                    'h-6 w-0.5 sm:hidden',
                    completado ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                  )}
                />
              )}
            </div>

            {/* Label */}
            <p
              className={cn(
                'mt-0.5 text-xs font-medium sm:mt-0 sm:text-center',
                cancelado
                  ? 'text-red-600'
                  : completado || activo
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500'
              )}
            >
              {paso.label}
            </p>

            {/* Línea conectora desktop */}
            {i < PASOS.length - 1 && (
              <div
                className={cn(
                  'hidden h-0.5 flex-1 sm:block',
                  completado ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}

      {cancelado && (
        <div className="mt-3 sm:mt-0">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Cancelado
          </span>
        </div>
      )}
    </div>
  )
}
