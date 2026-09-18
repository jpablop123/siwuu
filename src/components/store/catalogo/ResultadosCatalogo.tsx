'use client'

import { cn } from '@/lib/utils'
import { useFiltros } from './FiltrosProvider'

/**
 * Envuelve la grilla: mientras el servidor calcula los resultados nuevos, los
 * viejos se atenúan y dejan de recibir toques.
 *
 * No hay spinner: el filtro ya respondió al instante (estado optimista), así
 * que basta con dejar claro que lo de abajo está por cambiar.
 */
export function ResultadosCatalogo({ children }: { children: React.ReactNode }) {
  const { pendiente } = useFiltros()

  return (
    <div
      aria-busy={pendiente}
      className={cn(
        'transition-opacity duration-150',
        pendiente && 'pointer-events-none opacity-50',
      )}
    >
      {children}
    </div>
  )
}
