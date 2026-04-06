import { createServiceClient } from '@/lib/supabase/server'
import { obtenerMetricasDashboard } from '@/lib/actions/admin'
import { StatsCard } from '@/components/admin/StatsCard'
import { VentasChart } from '@/components/admin/VentasChart'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { formatCOP } from '@/lib/utils'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { DollarSign, ShoppingCart, AlertTriangle, Users } from 'lucide-react'
import Link from 'next/link'
import type { EstadoPedido } from '@/types'

export default async function AdminDashboard() {
  const supabase = createServiceClient()
  const metricas = await obtenerMetricasDashboard()

  // Últimos 10 pedidos
  const { data: ultimosPedidos } = await supabase
    .from('pedidos')
    .select('id, numero, created_at, total, estado, nombre_cliente, ciudad')
    .order('created_at', { ascending: false })
    .limit(10)

  const pedidos = (ultimosPedidos as Array<{
    id: string
    numero: string
    created_at: string
    total: number
    estado: EstadoPedido
    nombre_cliente: string
    ciudad: string
  }>) || []

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:mb-8 sm:text-2xl dark:text-zinc-100">Dashboard</h1>

      {/* Fila 1: Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          titulo="Ventas del mes"
          valor={formatCOP(metricas.ventasMes)}
          icono={<DollarSign className="h-5 w-5" />}
          colorIcono="bg-green-100 text-green-600"
        />
        <StatsCard
          titulo="Pedidos hoy"
          valor={metricas.pedidosHoy}
          icono={<ShoppingCart className="h-5 w-5" />}
          colorIcono="bg-blue-100 text-blue-600"
        />
        <StatsCard
          titulo="Requieren atención"
          valor={metricas.pedidosPendientes}
          icono={<AlertTriangle className="h-5 w-5" />}
          alerta={metricas.pedidosPendientes > 0}
          colorIcono="bg-amber-100 text-amber-600"
        />
        <StatsCard
          titulo="Clientes"
          valor={metricas.totalClientes}
          icono={<Users className="h-5 w-5" />}
          colorIcono="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* Fila 2: Chart + Top Productos */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Ventas últimos 30 días</h2>
          <ErrorBoundary label="Error al cargar el gráfico de ventas">
            <VentasChart data={metricas.ventasPorDia} />
          </ErrorBoundary>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Top 5 Productos</h2>
          {metricas.topProductos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sin datos aún</p>
          ) : (
            <ol className="space-y-3">
              {metricas.topProductos.map((p, i) => (
                <li key={p.nombre} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.nombre}</p>
                    <p className="text-xs text-zinc-500">
                      {p.unidades} uds · {formatCOP(p.ingresos)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Fila 3: Últimos pedidos */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-100">Últimos pedidos</h2>
          <Link
            href="/admin/pedidos"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {/* Cards mobile */}
        <div className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-700">
          {pedidos.map((p) => (
            <Link
              key={p.id}
              href={`/admin/pedidos/${p.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">{p.numero}</span>
                  <EstadoPedidoBadge estado={p.estado} />
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {p.nombre_cliente} · {p.ciudad}
                </p>
              </div>
              <span className="ml-3 shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatCOP(p.total)}</span>
            </Link>
          ))}
          {pedidos.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500">No hay pedidos aún</div>
          )}
        </div>

        {/* Tabla desktop */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <th className="px-5 py-3">Número</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Ciudad</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {pedidos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {p.numero}
                    </td>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">{p.nombre_cliente}</td>
                    <td className="px-5 py-3 text-zinc-500">{p.ciudad}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                      {new Date(p.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(p.total)}
                    </td>
                    <td className="px-5 py-3">
                      <EstadoPedidoBadge estado={p.estado} />
                    </td>
                    <td className="px-5 py-3 text-right">
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
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                      No hay pedidos aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
