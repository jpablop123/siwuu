import { createClient } from '@/lib/supabase/server'
import { vincularPedidosHuerfanos } from '@/lib/actions/cuenta'
import { Price } from '@/components/store/Price'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PackageOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Pedido } from '@/types'

export const metadata: Metadata = {
  title: 'Mis pedidos',
  robots: 'noindex',
}

export default async function MisPedidosPage() {
  // Reclamar silenciosamente pedidos de invitado con el mismo email verificado.
  // Idempotente: no-op si ya fueron vinculados o si no hay huérfanos.
  await vincularPedidosHuerfanos()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, items:pedido_items(id)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const lista = (pedidos as (Pedido & { items: { id: string }[] })[]) || []

  if (lista.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageOpen className="h-16 w-16 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">Todavía no tenés pedidos</h2>
        <p className="mt-2 text-sm text-zinc-500">Explorá nuestro catálogo y hacé tu primera compra</p>
        <Link href="/productos" className="mt-6">
          <Button>Empezar a comprar</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mis pedidos</h1>
      <div className="space-y-3">
        {lista.map((pedido) => (
          <Link
            key={pedido.id}
            href={`/cuenta/pedidos/${pedido.id}`}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{pedido.numero}</p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {new Date(pedido.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {pedido.items.length} producto{pedido.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <EstadoPedidoBadge estado={pedido.estado} />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
                <Price amount={pedido.total} />
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-500" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
