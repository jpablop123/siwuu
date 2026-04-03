import { createClient } from '@/lib/supabase/server'
import { Price } from '@/components/store/Price'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/types'

interface Props {
  params: { orderId: string }
}

export default async function GraciasPage({ params }: Props) {
  const supabase = createClient()

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*, items:pedido_items(*)')
    .eq('id', params.orderId)
    .single()

  if (!pedido) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
        <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const p = pedido as Pedido & { items: PedidoItem[] }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold">¡Gracias por tu compra!</h1>
      <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">Tu pedido ha sido recibido</p>

      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-6 text-left">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4">
          <div>
            <p className="text-sm text-zinc-500">Número de pedido</p>
            <p className="text-lg font-bold">{p.numero}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Total</p>
            <Price amount={p.total} className="text-lg font-bold" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {p.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.nombre_producto} x{item.cantidad}
                {item.variante && ` (${item.variante})`}
              </span>
              <Price amount={item.subtotal} className="font-medium" />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Envío a: {p.direccion_envio}, {p.ciudad}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        Te notificaremos por email cuando tu pedido sea despachado.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/productos"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Seguir comprando
        </Link>
        <Link
          href="/cuenta/pedidos"
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Ver mis pedidos
        </Link>
      </div>
    </div>
  )
}
