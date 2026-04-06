import { createServiceClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils'
import { StatsCard } from '@/components/admin/StatsCard'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, DollarSign, Receipt, Clock, Star } from 'lucide-react'
import type { Metadata } from 'next'
import type { EstadoPedido, Direccion } from '@/types'

export const metadata: Metadata = {
  title: 'Detalle Cliente - Admin',
  robots: 'noindex',
}

interface Props {
  params: { id: string }
}

export default async function AdminClienteDetallePage({ params }: Props) {
  const supabase = createServiceClient()

  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!perfil || perfil.rol !== 'cliente') notFound()

  // Fetch pedidos y direcciones en paralelo
  const [pedidosRes, direccionesRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, numero, created_at, total, estado, ciudad')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('direcciones')
      .select('*')
      .eq('user_id', params.id)
      .order('principal', { ascending: false }),
  ])

  const pedidos = (pedidosRes.data || []) as Array<{
    id: string
    numero: string
    created_at: string
    total: number
    estado: EstadoPedido
    ciudad: string
  }>

  const direcciones = (direccionesRes.data || []) as Direccion[]

  // Stats
  const totalPedidos = pedidos.length
  const totalGastado = pedidos
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + p.total, 0)
  const ticketPromedio = totalPedidos > 0 ? Math.round(totalGastado / totalPedidos) : 0
  const ultimoPedido = pedidos[0]?.created_at || null

  // Initials for avatar
  const nombre = (perfil.nombre as string) || 'Cliente'
  const initials = nombre
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a clientes
      </Link>

      {/* Perfil */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{nombre}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              {perfil.telefono && (
                <a href={`tel:${perfil.telefono}`} className="text-indigo-600 hover:underline">
                  {perfil.telefono as string}
                </a>
              )}
              <span className="text-zinc-500">
                Registrado:{' '}
                {new Date(perfil.created_at as string).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          titulo="Pedidos totales"
          valor={totalPedidos}
          icono={<ShoppingCart className="h-5 w-5" />}
          colorIcono="bg-blue-100 text-blue-600"
        />
        <StatsCard
          titulo="Total gastado"
          valor={formatCOP(totalGastado)}
          icono={<DollarSign className="h-5 w-5" />}
          colorIcono="bg-green-100 text-green-600"
        />
        <StatsCard
          titulo="Ticket promedio"
          valor={ticketPromedio > 0 ? formatCOP(ticketPromedio) : '\u2014'}
          icono={<Receipt className="h-5 w-5" />}
          colorIcono="bg-amber-100 text-amber-600"
        />
        <StatsCard
          titulo="Último pedido"
          valor={
            ultimoPedido
              ? new Date(ultimoPedido).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })
              : '\u2014'
          }
          icono={<Clock className="h-5 w-5" />}
          colorIcono="bg-indigo-100 text-indigo-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Historial de pedidos */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 lg:col-span-2">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Historial de pedidos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {pedidos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {p.numero}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {new Date(p.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.ciudad}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCOP(p.total)}</td>
                    <td className="px-4 py-3">
                      <EstadoPedidoBadge estado={p.estado} />
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
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Sin pedidos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Direcciones */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Direcciones</h2>
          </div>
          <div className="divide-y divide-zinc-200 p-5 dark:divide-zinc-700">
            {direcciones.map((dir) => (
              <div key={dir.id} className="py-3 first:pt-0 last:pb-0">
                {dir.principal && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Star className="h-3 w-3" aria-hidden="true" /> Principal
                  </span>
                )}
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{dir.nombre_destinatario}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{dir.direccion}</p>
                {dir.barrio && <p className="text-xs text-zinc-500">Barrio: {dir.barrio}</p>}
                <p className="text-xs text-zinc-500">
                  {dir.ciudad}, {dir.departamento}
                </p>
                <p className="text-xs text-zinc-500">Tel: {dir.telefono}</p>
              </div>
            ))}
            {direcciones.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">Sin direcciones</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
