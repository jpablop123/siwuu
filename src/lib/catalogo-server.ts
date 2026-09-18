import { createClient } from '@/lib/supabase/server'
import { POR_PAGINA, type FiltrosCatalogo } from '@/lib/catalogo'
import { getCategoriasActivas } from '@/lib/cache/cms'
import { categoriasQueCoinciden, filtroTexto } from '@/lib/busqueda'
import type { Producto, Variante } from '@/types'

/** El catálogo trae las variantes para poder preguntar color y capacidad desde la tarjeta. */
export type ProductoConVariantes = Producto & { variantes?: Variante[] | null }

/**
 * La consulta del catálogo, una sola vez para /productos y /categoria/[slug].
 *
 * Antes cada página armaba su propia query con su propio switch de orden, y
 * se habían desalineado: la de categoría no soportaba búsqueda. La búsqueda
 * por texto comparte reglas con /api/buscar (ver lib/busqueda.ts).
 */
export async function buscarProductos(
  filtros: FiltrosCatalogo,
  categoriaId: string | null,
  pagina: number,
): Promise<{ productos: ProductoConVariantes[]; total: number }> {
  const supabase = createClient()

  let query = supabase
    .from('productos')
    .select('*, variantes(*)', { count: 'exact' })
    .eq('activo', true)

  // Misma lógica que el buscador instantáneo: nombre, descripción corta y
  // categoría. Si no, "Ver los 5 resultados" llevaba a una página vacía.
  if (filtros.q) {
    const categorias = await getCategoriasActivas()
    const ids = categoriasQueCoinciden(filtros.q, categorias).map((c) => c.id)
    const filtro = filtroTexto(filtros.q, ids)
    if (!filtro) return { productos: [], total: 0 }
    query = query.or(filtro)
  }
  if (categoriaId) query = query.eq('categoria_id', categoriaId)
  if (filtros.precio_min) query = query.gte('precio_venta', Number(filtros.precio_min))
  if (filtros.precio_max) query = query.lte('precio_venta', Number(filtros.precio_max))

  switch (filtros.orden) {
    case 'precio_asc':
      query = query.order('precio_venta', { ascending: true })
      break
    case 'precio_desc':
      query = query.order('precio_venta', { ascending: false })
      break
    case 'nuevo':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query
        .order('destacado', { ascending: false })
        .order('created_at', { ascending: false })
  }

  const desde = (pagina - 1) * POR_PAGINA
  const { data, count } = await query.range(desde, desde + POR_PAGINA - 1)

  return { productos: (data as ProductoConVariantes[]) ?? [], total: count ?? 0 }
}
