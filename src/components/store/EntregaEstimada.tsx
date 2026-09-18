import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIAS_ENTREGA } from '@/lib/encargos'

/**
 * El plazo de entrega, dicho antes de pagar.
 *
 * Todo se compra en Estados Unidos cuando el cliente hace el pedido, así que
 * nada llega al día siguiente. Enterarse de eso después de haber transferido
 * varios millones es la principal fuente de reclamos — y de contracargos.
 * Por eso esta línea va en la ficha, en el carrito y en el checkout.
 */
export function EntregaEstimada({
  className,
  variante = 'completa',
}: {
  className?: string
  /** `completa` explica el porqué; `linea` es una sola frase para resúmenes. */
  variante?: 'completa' | 'linea'
}) {
  if (variante === 'linea') {
    return (
      <p className={cn('flex items-start gap-2 text-xs text-ink-500 dark:text-ink-400', className)}>
        <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aduana-500" aria-hidden="true" />
        Llega en {DIAS_ENTREGA}: lo traemos de Estados Unidos para ti.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-aduana-200 bg-aduana-50 px-4 py-3 dark:border-aduana-500/30 dark:bg-aduana-500/10',
        className,
      )}
    >
      <Plane className="mt-0.5 h-4 w-4 shrink-0 text-aduana-600 dark:text-aduana-400" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">
        <b className="font-semibold text-ink-900 dark:text-white">Llega en {DIAS_ENTREGA}.</b>{' '}
        Lo compramos en Estados Unidos apenas confirmas el pedido y te lo llevamos hasta tu
        puerta. El precio ya incluye impuestos y envío: al recibirlo no pagas nada más.
      </p>
    </div>
  )
}
