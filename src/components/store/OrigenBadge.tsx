import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIAS_ENTREGA } from '@/lib/encargos'

interface OrigenBadgeProps {
  /** `importado` se compra en USA cuando el cliente pide; `local` ya está en Colombia. */
  origen?: 'importado' | 'local'
  className?: string
  /** `card` es compacto; `ficha` explica el plazo completo. */
  variante?: 'card' | 'ficha'
}

/**
 * De dónde viene el producto y cuánto tarda.
 *
 * El naranja aduana significa una sola cosa en toda la marca: origen y
 * tránsito. Por eso este badge es el único elemento naranja de una tarjeta —
 * y por eso nunca toca el botón de comprar.
 *
 * Va con naranja de fondo y tinta encima: como texto sobre blanco el naranja
 * no alcanza el contraste mínimo.
 */
export function OrigenBadge({ origen = 'importado', className, variante = 'card' }: OrigenBadgeProps) {
  if (origen === 'local') {
    // Lo que ya está en Colombia no necesita explicación: no lleva badge.
    return null
  }

  if (variante === 'ficha') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-aduana-500 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-900',
          className,
        )}
      >
        <Plane className="h-3.5 w-3.5" aria-hidden="true" />
        Importado · llega en {DIAS_ENTREGA}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-aduana-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-900',
        className,
      )}
    >
      <Plane className="h-3 w-3" aria-hidden="true" />
      Importado
    </span>
  )
}
