import type { Producto } from '@/types'
import { ProductCard } from './ProductCard'

/**
 * Grid del catálogo.
 *
 * Densidad alta a propósito: la gente entra a comparar, no a admirar. Dos
 * columnas ya desde 390px — una sola columna obliga a scrollear para ver el
 * segundo producto, y comparar dos precios uno debajo del otro no funciona.
 *
 * Las primeras seis fotos cargan con prioridad: son las que entran en el
 * primer viewport y las que definen el LCP.
 */
export function ProductGrid({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center dark:border-ink-800">
        <p className="font-heading text-lg font-bold text-ink-900 dark:text-white">
          No encontramos nada con esos filtros
        </p>
        <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
          Prueba quitando alguno, o pídelo de Estados Unidos y te lo traemos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {productos.map((producto, i) => (
        <ProductCard key={producto.id} producto={producto} prioridad={i < 6} />
      ))}
    </div>
  )
}
