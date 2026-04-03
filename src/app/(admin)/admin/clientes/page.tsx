import { createClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils'
import { Pagination } from '@/components/store/Pagination'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BusquedaClientes } from './BusquedaClientes'

export const metadata: Metadata = {
  title: 'Clientes - Admin',
  robots: 'noindex',
}

const PER_PAGE = 25

interface Props {
  searchParams: { q?: string; page?: string }
}

export default async function AdminClientesPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, page } = searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))

  // Fetch clients (profiles with rol = cliente)
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('rol', 'cliente')

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
  }

  query = query.order('created_at', { ascending: false })

  const from = (currentPage - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  const { data: clientes, count } = await query
  const totalPages = Math.ceil((count || 0) / PER_PAGE)

  // Fetch order stats for these clients
  const clientIds = (clientes || []).map((c) => c.id)
  const { data: pedidosData } = clientIds.length > 0
    ? await supabase
        .from('pedidos')
        .select('user_id, total, estado, created_at')
        .in('user_id', clientIds)
    : { data: [] }

  // Compute stats per client
  const statsMap: Record<string, { pedidos: number; gastado: number; ultimo: string | null }> = {}
  for (const p of pedidosData || []) {
    if (!p.user_id) continue
    if (!statsMap[p.user_id]) statsMap[p.user_id] = { pedidos: 0, gastado: 0, ultimo: null }
    statsMap[p.user_id].pedidos++
    if (p.estado !== 'cancelado') statsMap[p.user_id].gastado += p.total
    if (!statsMap[p.user_id].ultimo || p.created_at > statsMap[p.user_id].ultimo!) {
      statsMap[p.user_id].ultimo = p.created_at
    }
  }

  const rows = (clientes || []).map((c) => ({
    id: c.id as string,
    nombre: (c.nombre as string) || '\u2014',
    telefono: (c.telefono as string) || '\u2014',
    created_at: c.created_at as string,
    ...statsMap[c.id] || { pedidos: 0, gastado: 0, ultimo: null },
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Clientes ({count || 0})</h1>
      </div>

      <BusquedaClientes valorInicial={q} />

      {/* Cards mobile */}
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clientes/${c.id}`}
            className="block rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition-colors active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:active:bg-zinc-800"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</p>
              <span className="text-xs text-zinc-500">{c.telefono}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
              <span>{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</span>
              {c.gastado > 0 && <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCOP(c.gastado)}</span>}
              <span>
                Registro: {new Date(c.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Tabla desktop */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-center">Pedidos</th>
                <th className="px-4 py-3 text-right">Total gastado</th>
                <th className="px-4 py-3 text-right">Ticket prom.</th>
                <th className="px-4 py-3">Último pedido</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.telefono}</td>
                  <td className="px-4 py-3 text-center">{c.pedidos}</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {c.gastado > 0 ? formatCOP(c.gastado) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {c.pedidos > 0 ? formatCOP(Math.round(c.gastado / c.pedidos)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {c.ultimo
                      ? new Date(c.ultimo).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(c.created_at).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        createHref={(p) => {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (p > 1) params.set('page', p.toString())
          const qs = params.toString()
          return `/admin/clientes${qs ? `?${qs}` : ''}`
        }}
      />
    </div>
  )
}
