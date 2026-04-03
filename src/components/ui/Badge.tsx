import { cn } from '@/lib/utils'
import { ESTADOS_PEDIDO } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type { EstadoPedido } from '@/types'
import { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold font-mono uppercase tracking-wider border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        warning: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
        danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        accent: 'bg-amber-400 text-zinc-950 border-transparent',
        brand: 'bg-emerald-500 text-zinc-950 border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

function EstadoPedidoBadge({ estado }: { estado: EstadoPedido }) {
  const config = ESTADOS_PEDIDO[estado]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold font-mono uppercase tracking-wider',
        config.color
      )}
    >
      {config.label}
    </span>
  )
}

export { Badge, EstadoPedidoBadge, badgeVariants }
