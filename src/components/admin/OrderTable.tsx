import { formatCOP } from '@/lib/utils'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import type { Pedido } from '@/types'

export function OrderTable({ pedidos }: { pedidos: Pedido[] }) {
  if (pedidos.length === 0) {
    return <p className="py-8 text-center text-zinc-500">No hay pedidos</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-100/50 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Pedido</th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Cliente</th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Total</th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Fecha</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="border-b border-zinc-200 hover:bg-zinc-100/50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{pedido.numero}</td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-zinc-900 dark:text-zinc-100">{pedido.nombre_cliente}</p>
                  <p className="text-xs text-zinc-500">{pedido.email_cliente}</p>
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{formatCOP(pedido.total)}</td>
              <td className="px-4 py-3">
                <EstadoPedidoBadge estado={pedido.estado} />
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {new Date(pedido.created_at).toLocaleDateString('es-CO')}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/pedidos/${pedido.id}`}
                  className="text-emerald-400 hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
