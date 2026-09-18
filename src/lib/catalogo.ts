/**
 * Reglas del catálogo compartidas entre servidor y cliente.
 *
 * Todo lo que define "qué está filtrado" vive en la URL. Así el botón atrás
 * deshace un filtro, un link compartido abre la misma vista y el servidor
 * puede renderizar el resultado sin JavaScript.
 *
 * Este archivo no puede importar nada del servidor: lo usan los componentes
 * de filtros en el navegador.
 */

export const POR_PAGINA = 12

export interface FiltrosCatalogo {
  q?: string
  categoria?: string
  precio_min?: string
  precio_max?: string
  orden?: string
}

export type ModoCatalogo = 'catalogo' | 'categoria'

/* ── Orden ────────────────────────────────────────────────────────────────── */

export const ORDEN_OPCIONES = [
  { value: '', label: 'Destacados' },
  { value: 'nuevo', label: 'Más nuevos' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
] as const

const ORDENES_VALIDOS = new Set<string>(ORDEN_OPCIONES.map((o) => o.value).filter(Boolean))

/* ── Rangos de precio ─────────────────────────────────────────────────────── */

/**
 * Rangos predefinidos en pesos. En móvil, teclear "4000000" sin separadores es
 * donde la gente se equivoca y abandona: cuatro botones cubren casi todas las
 * búsquedas, y el campo libre queda para el que sabe exactamente cuánto tiene.
 */
export const RANGOS_PRECIO = [
  { id: 'hasta-500k', min: undefined, max: 500_000 },
  { id: '500k-2m', min: 500_000, max: 2_000_000 },
  { id: '2m-5m', min: 2_000_000, max: 5_000_000 },
  { id: 'mas-5m', min: 5_000_000, max: undefined },
] as const

/** "$500 mil", "$2 M", "$1,5 M" — cortos para caber en un chip. */
export function pesosCortos(valor: number): string {
  if (valor >= 1_000_000) {
    const millones = (valor / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })
    return `$${millones} M`
  }
  if (valor >= 1_000) return `$${Math.round(valor / 1_000)} mil`
  return `$${valor}`
}

export function etiquetaPrecio(min?: string, max?: string): string | null {
  const a = min ? Number(min) : undefined
  const b = max ? Number(max) : undefined
  if (a && b) return `${pesosCortos(a)} – ${pesosCortos(b)}`
  if (a) return `Desde ${pesosCortos(a)}`
  if (b) return `Hasta ${pesosCortos(b)}`
  return null
}

/* ── Parseo y URL ─────────────────────────────────────────────────────────── */

const soloDigitos = (v?: string) => {
  const limpio = (v ?? '').replace(/\D/g, '')
  return limpio && Number(limpio) > 0 ? limpio : undefined
}

/** Normaliza lo que llega en la URL: nada que no sea válido pasa a la consulta. */
export function parseFiltros(sp: Record<string, string | string[] | undefined>): FiltrosCatalogo {
  const uno = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }
  const q = uno('q')?.trim().slice(0, 80)
  const orden = uno('orden')

  return {
    q: q || undefined,
    categoria: uno('categoria') || undefined,
    precio_min: soloDigitos(uno('precio_min')),
    precio_max: soloDigitos(uno('precio_max')),
    orden: orden && ORDENES_VALIDOS.has(orden) ? orden : undefined,
  }
}

export function paginaDesde(sp: Record<string, string | string[] | undefined>): number {
  const v = sp.page
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * La URL para un estado de filtros.
 *
 * En modo `categoria` la categoría vive en la ruta (/categoria/celulares), que
 * es la URL que Google indexa. Si se quita la categoría, se vuelve al catálogo
 * completo conservando el resto de filtros.
 */
export function urlCatalogo(f: FiltrosCatalogo, modo: ModoCatalogo, pagina?: number): string {
  const params = new URLSearchParams()
  let ruta = '/productos'

  if (modo === 'categoria' && f.categoria) {
    ruta = `/categoria/${f.categoria}`
  } else if (f.categoria) {
    params.set('categoria', f.categoria)
  }

  if (f.q) params.set('q', f.q)
  if (f.precio_min) params.set('precio_min', f.precio_min)
  if (f.precio_max) params.set('precio_max', f.precio_max)
  if (f.orden) params.set('orden', f.orden)
  if (pagina && pagina > 1) params.set('page', String(pagina))

  const qs = params.toString()
  return qs ? `${ruta}?${qs}` : ruta
}

/** Cuántos filtros de verdad hay puestos (el orden no cuenta: no reduce resultados). */
export function contarFiltros(f: FiltrosCatalogo): number {
  return (f.categoria ? 1 : 0) + (f.precio_min || f.precio_max ? 1 : 0) + (f.q ? 1 : 0)
}
