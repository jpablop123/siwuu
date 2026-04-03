import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Price } from '@/components/store/Price'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { OrderTimeline } from './OrderTimeline'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import type { Pedido, PedidoItem, Pago } from '@/types'

export const metadata: Metadata = {
  title: 'Detalle de pedido',
  robots: 'noindex',
}

interface Props {
  params: { id: string }
}

export default async function DetallePedidoPage({ params }: Props) {
  const supabase = createClient()

  // Paralelo: auth + pedido (no dependen entre sí)
  const [{ data: { user } }, { data: pedido }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('pedidos')
      .select('*, items:pedido_items(*), pagos(*)')
      .eq('id', params.id)
      .single(),
  ])

  if (!pedido) notFound()

  // SEGURIDAD: verificar ownership
  if (pedido.user_id !== user!.id) notFound()

  const p = pedido as Pedido & { items: PedidoItem[]; pagos: Pago[] }
  const pago = p.pagos?.[0]

  return (
    <div>
      {/* Header */}
      <Link
        href="/cuenta/pedidos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Mis pedidos
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Pedido {p.numero}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {new Date(p.created_at).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <EstadoPedidoBadge estado={p.estado} />
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        <OrderTimeline estado={p.estado} />
      </div>

      {/* Items */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Productos</h2>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {p.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3 sm:gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:h-20 sm:w-20">
                {item.imagen_producto && (
                  <Image
                    src={item.imagen_producto}
                    alt={item.nombre_producto}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.nombre_producto}</p>
                {item.variante && (
                  <p className="text-xs text-zinc-500">{item.variante}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {item.cantidad} x <Price amount={item.precio_unitario} />
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <Price amount={item.subtotal} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen + Dirección + Pago */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Resumen de costos */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Resumen
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
              <Price amount={p.subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Envío</span>
              <span>{p.costo_envio === 0 ? 'Gratis' : <Price amount={p.costo_envio} />}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold dark:border-zinc-700">
              <span>Total</span>
              <Price amount={p.total} />
            </div>
          </div>
        </div>

        {/* Dirección de envío */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Dirección de envío
          </h2>
          <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <p className="font-medium">{p.nombre_cliente}</p>
            <p>{p.direccion_envio}</p>
            <p>{p.ciudad}, {p.departamento}</p>
            <p>{p.telefono_cliente}</p>
          </div>
        </div>

        {/* Información de pago */}
        {pago && (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Pago
            </h2>
            <div className="space-y-2 text-sm">
              {pago.metodo && (
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Método</span>
                  <span className="font-medium">{pago.metodo}</span>
                </div>
              )}
              {pago.wompi_referencia && (
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Referencia</span>
                  <span className="font-mono text-xs">{pago.wompi_referencia}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Estado</span>
                <Badge
                  variant={
                    pago.estado === 'aprobado'
                      ? 'success'
                      : pago.estado === 'rechazado'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {pago.estado}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
