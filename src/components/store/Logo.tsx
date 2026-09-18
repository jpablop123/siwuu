import { cn } from '@/lib/utils'

/**
 * Logo Siwuu — dirección "Aduana".
 *
 * Wordmark trazado en vector (los glifos van como contornos, así que no depende
 * de que la fuente esté disponible) junto al isotipo: el arco es la ruta de
 * Miami a Colombia y el punto naranja es la entrega.
 *
 * Los archivos viven en `public/brand/`. Se sirven dos versiones y se alterna
 * por CSS según el tema, porque un SVG cargado como <img> no hereda color.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img
        src="/brand/siwuu-horizontal.svg"
        alt="Siwuu"
        width={342}
        height={198}
        className={cn('h-8 w-auto dark:hidden', className)}
      />
      <img
        src="/brand/siwuu-horizontal-blanco.svg"
        alt=""
        aria-hidden="true"
        width={342}
        height={198}
        className={cn('hidden h-8 w-auto dark:block', className)}
      />
    </>
  )
}

/** Solo el símbolo — para avatares, badges y espacios apretados. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/siwuu-isotipo.svg"
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      className={cn('h-8 w-8', className)}
    />
  )
}
