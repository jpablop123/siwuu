/**
 * Tipos y utilidades del buscador, compartidos entre el endpoint y el cliente.
 */

/** Por debajo de esto no se consulta: dos letras ya filtran algo útil. */
export const MIN_CARACTERES = 2

export interface ResultadoProducto {
  id: string
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  categoria: string | null
}

export interface ResultadoCategoria {
  slug: string
  nombre: string
}

export interface RespuestaBusqueda {
  q: string
  productos: ResultadoProducto[]
  categorias: ResultadoCategoria[]
  /** Total de productos que coinciden, no solo los que se devuelven. */
  total: number
}

/**
 * Minúsculas y sin tildes, carácter por carácter.
 *
 * Se normaliza cada carácter por separado para que el resultado tenga el mismo
 * largo que el original: así la posición de una coincidencia sirve para
 * resaltar el texto tal como se escribió.
 */
export function normalizar(texto: string): string {
  return Array.from(texto)
    .map((c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().charAt(0) || c)
    .join('')
}

/**
 * Categorías cuyo nombre contiene lo buscado, sin tildes.
 *
 * "cargador" encuentra "Cargadores y cables" y "celular" encuentra "Celulares":
 * así la búsqueda en español llega a productos cuyo nombre oficial está en
 * inglés ("Travel Charger", "Power Adapter").
 */
export function categoriasQueCoinciden<T extends { nombre: string }>(q: string, categorias: T[]): T[] {
  const termino = normalizar(q.trim())
  if (!termino) return []
  return categorias.filter((c) => normalizar(c.nombre).includes(termino))
}

/** Lo buscado sin los caracteres que rompen la sintaxis de filtros de PostgREST. */
export function terminoSeguro(q: string): string {
  return q.replace(/[%,()"\\*]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Filtro `or` para Supabase: nombre, descripción corta o categoría.
 * Devuelve null si después de limpiar no queda nada que buscar.
 */
export function filtroTexto(q: string, categoriaIds: string[]): string | null {
  const limpio = terminoSeguro(q)
  if (!limpio) return null
  const partes = [`nombre.ilike.%${limpio}%`, `descripcion_corta.ilike.%${limpio}%`]
  if (categoriaIds.length > 0) partes.push(`categoria_id.in.(${categoriaIds.join(',')})`)
  return partes.join(',')
}
