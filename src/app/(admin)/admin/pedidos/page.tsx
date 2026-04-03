import { createClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils'
import { Pagination } from '@/components/store/Pagination'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import type { Metadata } from 'next'
import type { EstadoPedido } from '@/types'
import { TabsEstadoPedidos } from './TabsEstadoPedidos'
import { CambioEstadoRapido } from './CambioEstadoRapido'
import { BusquedaPedidos } from './BusquedaPedidos'

export const metadata: Metadata = {
  title: 'Pedidos - Admin',
  robots: 'noindex',
}

const PER_PAGE = 25

function tiempoRelativo(fecha: string): string {
  const ahora = Date.now()
  const diff = ahora - new Date(fecha).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias < 30) return `hace ${dias}d`
  return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

interface Props {
  searchParams: { estado?: string; q?: string; page?: string }
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const supabase = createClient()
  const { estado, q, page } = searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))

  // Fetch conteos por estado
  const { data: todosLosEstados } = await supabase
    .from('pedidos')
    .select('estado')

  const conteos: Record<string, number> = {}
  let totalPedidos = 0
  for (const p of todosLosEstados || []) {
    conteos[p.estado] = (conteos[p.estado] || 0) + 1
    totalPedidos++
  }

  // Query principal
  let query = supabase
    .from('pedidos')
    .select('id, numero, created_at, total, estado, numero_guia, nombre_cliente, email_cliente, ciudad', { count: 'exact' })

  // Filtro por estado
  if (estado === 'urgentes') {
    query = query.in('estado', ['pendiente', 'pago_confirmado'])
  } else if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  // Búsqueda
  if (q) {
    query = query.or(`numero.ilike.%${q}%,email_cliente.ilike.%${q}%,nombre_cliente.ilike.%${q}%`)
  }

  // Ordenar: urgentes primero, luego por fecha
  query = query.order('created_at', { ascending: false })

  // Paginación
  const from = (currentPage - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  const { data: pedidos, count } = await query
  const totalPages = Math.ceil((count || 0) / PER_PAGE)

  const rows = (pedidos as Array<{
    id: string
    numero: string
    created_at: string
    total: number
    estado: EstadoPedido
    numero_guia: string | null
    nombre_cliente: string
    email_cliente: string
    ciudad: string
  }>) || []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Pedidos ({totalPedidos})</h1>
      </div>

      {/* Tabs */}
      <TabsEstadoPedidos estadoActual={estado || 'todos'} conteos={conteos} />

      {/* Búsqueda */}
      <div className="mt-4">
        <BusquedaPedidos valorInicial={q} />
      </div>

      {/* Cards mobile */}
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/admin/pedidos/${p.id}`}
            className="block rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition-colors active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:active:bg-zinc-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-indigo-600">{p.numero}</span>
              <span className="text-xs text-zinc-500">{tiempoRelativo(p.created_at)}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.nombre_cliente}</p>
            <p className="text-xs text-zinc-500">{p.ciudad}</p>
            <div className="mt-3 flex items-center justify-between">
              <CambioEstadoRapido pedidoId={p.id} estadoActual={p.estado} />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCOP(p.total)}</span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            No se encontraron pedidos
          </div>
        )}
      </div>

      {/* Tabla desktop */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Guía</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                    >
                      {p.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.nombre_cliente}</p>
                    <p className="text-xs text-zinc-500">{p.email_cliente} · {p.ciudad}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                    {tiempoRelativo(p.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCOP(p.total)}
                  </td>
                  <td className="px-4 py-3">
                    <CambioEstadoRapido pedidoId={p.id} estadoActual={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.numero_guia ? (
                      <Check className="mx-auto h-4 w-4 text-green-500" aria-label="Tiene guía" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-zinc-600" aria-label="Sin guía" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        createHref={(p) => {
          const params = new URLSearchParams()
          if (estado) params.set('estado', estado)
          if (q) params.set('q', q)
          if (p > 1) params.set('page', p.toString())
          const qs = params.toString()
          return `/admin/pedidos${qs ? `?${qs}` : ''}`
        }}
      />
    </div>
  )
}
