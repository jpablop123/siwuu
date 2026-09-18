import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { rlBusqueda } from '@/lib/ratelimit'
import { getCategoriasActivas } from '@/lib/cache/cms'
import {
  MIN_CARACTERES,
  categoriasQueCoinciden,
  filtroTexto,
  normalizar,
  terminoSeguro,
  type RespuestaBusqueda,
  type ResultadoProducto,
} from '@/lib/busqueda'

export const runtime = 'nodejs'

/**
 * Cliente anónimo, no el de cookies: los resultados son iguales para todo el
 * mundo, y así la respuesta se puede cachear en la CDN. Lee con las mismas
 * políticas RLS que ve un visitante sin cuenta.
 *
 * Se crea dentro de la petición, no al cargar el módulo: durante el build no
 * hay variables de entorno, y crear el cliente ahí tumbaba el despliegue
 * ("supabaseUrl is required"). Misma razón por la que el resto de la app no
 * toca Supabase en tiempo de build.
 */
let cliente: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  if (cliente) return cliente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  cliente = createClient(url, anon, { auth: { persistSession: false } })
  return cliente
}

/** Cache corto en la CDN: el catálogo no cambia de un minuto a otro. */
const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

const vacia = (q: string): RespuestaBusqueda => ({ q, productos: [], categorias: [], total: 0 })

/**
 * GET /api/buscar?q=cargador
 *
 * Búsqueda instantánea para el buscador. Devuelve hasta 6 productos, hasta 3
 * categorías y el total de coincidencias.
 *
 * Busca en nombre, descripción corta y categoría. Lo último importa: los
 * nombres oficiales vienen en inglés ("Travel Charger") y la gente busca en
 * español ("cargador"). Los que coinciden por nombre van primero.
 *
 * Hoy usa ILIKE, suficiente para un catálogo de decenas de productos. Con
 * miles conviene un índice pg_trgm y la extensión unaccent.
 */
export async function GET(request: Request) {
  const rl = await rlBusqueda(request)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Demasiadas búsquedas seguidas. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 80)
  if (q.length < MIN_CARACTERES) {
    return NextResponse.json(vacia(q), { headers: { 'Cache-Control': CACHE } })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(vacia(q), { headers: { 'Cache-Control': 'no-store' } })
  }

  const categorias = await getCategoriasActivas()
  const coinciden = categoriasQueCoinciden(q, categorias)
  const filtro = filtroTexto(q, coinciden.map((c) => c.id))
  if (!filtro) {
    return NextResponse.json(vacia(q), { headers: { 'Cache-Control': CACHE } })
  }

  const { data, count, error } = await supabase
    .from('productos')
    .select('id, slug, nombre, precio_venta, imagenes, categoria:categorias(nombre)', { count: 'exact' })
    .eq('activo', true)
    .or(filtro)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    return NextResponse.json({ error: 'No se pudo buscar' }, { status: 500 })
  }

  const termino = normalizar(terminoSeguro(q))

  const productos: ResultadoProducto[] = (data ?? [])
    .map((p) => {
      const cat = p.categoria as { nombre: string } | { nombre: string }[] | null
      return {
        id: p.id as string,
        slug: p.slug as string,
        nombre: p.nombre as string,
        precio: Number(p.precio_venta),
        imagen: (p.imagenes as string[] | null)?.find(Boolean) ?? null,
        categoria: Array.isArray(cat) ? cat[0]?.nombre ?? null : cat?.nombre ?? null,
      }
    })
    // Primero lo que coincide por nombre; el resto conserva el orden de destacados.
    .sort((a, b) => Number(normalizar(b.nombre).includes(termino)) - Number(normalizar(a.nombre).includes(termino)))
    .slice(0, 6)

  const respuesta: RespuestaBusqueda = {
    q,
    productos,
    categorias: coinciden.slice(0, 3).map((c) => ({ slug: c.slug, nombre: c.nombre })),
    total: count ?? productos.length,
  }

  return NextResponse.json(respuesta, { headers: { 'Cache-Control': CACHE } })
}
