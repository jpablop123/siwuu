import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo Siwuu (wordmark "siwuu" — variante 2 oficial).
 *
 * Imagen verde sobre fondo transparente, así que se ve bien tanto en modo
 * claro (fondo blanco) como oscuro (fondo casi negro). El tamaño se controla
 * con la clase de altura (`h-7` por defecto); el ancho se ajusta solo.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Siwuu"
      width={948}
      height={263}
      priority
      className={cn('h-7 w-auto', className)}
    />
  )
}
