import { cn } from '@/lib/utils'
import { ESTADOS_ENVIO } from '@/lib/brand'

interface TrackingBarProps {
  /** Estado actual (índice). Si no se pasa, se muestra la ruta completa sin marcar progreso. */
  activo?: number
  estados?: readonly string[]
  className?: string
  /** `compacta` cabe en una línea del hero; `detallada` se usa en páginas de pedido. */
  variante?: 'compacta' | 'detallada'
}

/**
 * Barra de estado del envío — el elemento firma de la marca.
 *
 * Es el recurso gráfico que hace visible el servicio: el cliente ve el camino
 * completo desde que se compra en Estados Unidos hasta que timbran en su casa.
 * Se repite en la home, en la ficha, en el seguimiento del pedido y en el
 * correo de confirmación.
 */
export function TrackingBar({
  activo,
  estados = ESTADOS_ENVIO,
  className,
  variante = 'compacta',
}: TrackingBarProps) {
  const total = estados.length

  return (
    <ol
      className={cn(
        'flex items-center',
        variante === 'compacta' ? 'gap-2 sm:gap-3' : 'gap-3',
        className,
      )}
      aria-label="Estados del envío"
    >
      {estados.map((estado, i) => {
        const alcanzado = activo === undefined ? true : i <= activo
        const esActual = activo === i
        return (
          <li key={estado} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  esActual
                    ? 'bg-aduana-500 ring-4 ring-aduana-500/20'
                    : alcanzado
                      ? 'bg-brand-500'
                      : 'bg-ink-300 dark:bg-ink-700',
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'truncate font-mono text-[10px] uppercase tracking-wider sm:text-[11px]',
                  esActual
                    ? 'font-bold text-aduana-600 dark:text-aduana-400'
                    : alcanzado
                      ? 'text-ink-600 dark:text-ink-300'
                      : 'text-ink-400 dark:text-ink-600',
                )}
              >
                {estado}
              </span>
            </span>
            {i < total - 1 && (
              <span
                className={cn(
                  'h-px min-w-3 flex-1',
                  alcanzado && activo !== undefined && i < activo
                    ? 'bg-brand-500/60'
                    : 'bg-ink-200 dark:bg-ink-700',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
