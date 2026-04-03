import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { EstadoPedido } from '@/types'

const STEPS: { key: EstadoPedido; label: string }[] = [
  { key: 'pago_confirmado', label: 'Pago confirmado' },
  { key: 'procesando', label: 'Procesando' },
  { key: 'enviado_proveedor', label: 'Enviado al proveedor' },
  { key: 'en_camino', label: 'En camino' },
  { key: 'entregado', label: 'Entregado' },
]

export function OrderTracker({ estado }: { estado: EstadoPedido }) {
  if (estado === 'pendiente' || estado === 'cancelado') {
    return (
      <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {estado === 'pendiente' ? 'Esperando confirmación de pago' : 'Pedido cancelado'}
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.key === estado)

  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const isCompleted = i <= currentIndex
        const isCurrent = i === currentIndex
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i <= currentIndex ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                  )}
                />
              )}
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isCompleted
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i < currentIndex ? 'bg-emerald-500' : 'bg-zinc-700'
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-center text-xs',
                isCurrent ? 'font-semibold text-emerald-400' : 'text-zinc-500'
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
