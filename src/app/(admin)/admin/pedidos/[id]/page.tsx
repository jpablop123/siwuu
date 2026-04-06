import { createServiceClient } from '@/lib/supabase/server'
import { formatCOP } from '@/lib/utils'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { OrderStatusManager } from '@/components/admin/OrderStatusManager'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import type { EstadoPedido } from '@/types'
import { BotonCancelarPedido } from './BotonCancelarPedido'

export const metadata: Metadata = {
  title: 'Detalle Pedido - Admin',
  robots: 'noindex',
}

interface Props {
  params: { id: string }
}

export default async function AdminDetallePedidoPage({ params }: Props) {
  const supabase = createServiceClient()

  // Fetch pedido con items, productos (para url_proveedor y precio_costo) y pagos
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pedido) notFound()

  const [itemsRes, pagosRes] = await Promise.all([
    supabase
      .from('pedido_items')
      .select('*, producto:productos(url_proveedor, precio_costo)')
      .eq('pedido_id', pedido.id),
    supabase
      .from('pagos')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('created_at', { ascending: false }),
  ])

  const items = (itemsRes.data || []) as Array<{
    id: string
    nombre_producto: string
    imagen_producto: string | null
    variante: string | null
    cantidad: number
    precio_unitario: number
    subtotal: number
    producto: { url_proveedor: string | null; precio_costo: number | null } | null
  }>

  const pagos = (pagosRes.data || []) as Array<{
    id: string
    monto: number
    moneda: string
    metodo: string | null
    wompi_referencia: string | null
    wompi_transaction_id: string | null
    estado: string
    created_at: string
  }>

  const pago = pagos[0] || null

  // Resumen financiero
  const costoTotal = items.reduce((sum, item) => {
    const costo = item.producto?.precio_costo
    return costo ? sum + costo * item.cantidad : sum
  }, 0)
  const tieneCostos = items.some((i) => i.producto?.precio_costo)
  const ingresos = pedido.total
  const ganancia = tieneCostos ? ingresos - costoTotal - pedido.costo_envio : 0
  const margen = tieneCostos && ingresos > 0 ? ((ganancia / ingresos) * 100).toFixed(1) : null

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a pedidos
      </Link>

      <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Pedido {pedido.numero}</h1>
          <p className="text-sm text-zinc-500">
            {new Date(pedido.created_at).toLocaleString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <EstadoPedidoBadge estado={pedido.estado as EstadoPedido} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cliente y Dirección */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Cliente y Dirección</h2>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{pedido.nombre_cliente}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <a href={`mailto:${pedido.email_cliente}`} className="text-indigo-600 hover:underline">
                {pedido.email_cliente}
              </a>
              <a href={`tel:${pedido.telefono_cliente}`} className="text-indigo-600 hover:underline">
                {pedido.telefono_cliente}
              </a>
            </div>
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>{pedido.direccion_envio}</p>
              <p>{pedido.ciudad}, {pedido.departamento}</p>
              {pedido.notas && (
                <p className="mt-1 italic text-zinc-500">{pedido.notas}</p>
              )}
            </div>
          </div>

          {/* Items del Pedido */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Items del Pedido</h2>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3 sm:items-center sm:gap-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-14 sm:w-14 dark:bg-zinc-800">
                    {item.imagen_producto && (
                      <Image
                        src={item.imagen_producto}
                        alt={item.nombre_producto}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.nombre_producto}</p>
                    {item.variante && (
                      <p className="text-xs text-zinc-500">{item.variante}</p>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
                      {item.cantidad} x {formatCOP(item.precio_unitario)}
                    </p>
                  </div>
                  <p className="hidden whitespace-nowrap text-sm text-zinc-600 sm:block dark:text-zinc-400">
                    {item.cantidad} x {formatCOP(item.precio_unitario)}
                  </p>
                  <p className="whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCOP(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>{formatCOP(pedido.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Envío</span>
                <span>{pedido.costo_envio === 0 ? 'Gratis' : formatCOP(pedido.costo_envio)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCOP(pedido.total)}</span>
              </div>
            </div>
          </div>

          {/* Información de Pago */}
          {pago && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Información de Pago</h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-zinc-500">Método</p>
                  <p className="font-medium">{pago.metodo ?? 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Estado del pago</p>
                  <EstadoPedidoBadge
                    estado={
                      pago.estado === 'aprobado'
                        ? 'pago_confirmado'
                        : pago.estado === 'rechazado'
                          ? 'cancelado'
                          : ('pendiente' as EstadoPedido)
                    }
                  />
                </div>
                {pago.wompi_referencia && (
                  <div>
                    <p className="text-zinc-500">Referencia Wompi</p>
                    <p className="font-mono text-xs">{pago.wompi_referencia}</p>
                  </div>
                )}
                {pago.wompi_transaction_id && (
                  <div>
                    <p className="text-zinc-500">Transaction ID</p>
                    <p className="font-mono text-xs">{pago.wompi_transaction_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500">Monto</p>
                  <p className="font-medium">{formatCOP(pago.monto)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resumen Financiero */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-5 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
            <h2 className="mb-4 text-lg font-semibold">Resumen Financiero (Confidencial)</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400">Ingresos</p>
                <p className="text-lg font-bold">{formatCOP(ingresos)}</p>
              </div>
              <div>
                <p className="text-zinc-600 dark:text-zinc-400">Costo estimado</p>
                <p className="text-lg font-bold">{tieneCostos ? formatCOP(costoTotal) : '\u2014'}</p>
              </div>
              <div>
                <p className="text-zinc-600 dark:text-zinc-400">Ganancia</p>
                <p className={`text-lg font-bold ${tieneCostos && ganancia > 0 ? 'text-green-400' : tieneCostos ? 'text-red-400' : 'text-zinc-500'}`}>
                  {tieneCostos ? formatCOP(ganancia) : '\u2014'}
                </p>
              </div>
              <div>
                <p className="text-zinc-600 dark:text-zinc-400">Margen</p>
                <p className={`text-lg font-bold ${margen && parseFloat(margen) > 30 ? 'text-green-400' : margen && parseFloat(margen) > 15 ? 'text-yellow-400' : margen ? 'text-red-400' : 'text-zinc-500'}`}>
                  {margen ? `${margen}%` : '\u2014'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <OrderStatusManager
            pedidoId={pedido.id}
            estadoActual={pedido.estado}
            numeroGuiaActual={pedido.numero_guia ?? undefined}
            itemsConProveedor={items.map((i) => ({
              nombre: i.nombre_producto,
              cantidad: i.cantidad,
              urlProveedor: i.producto?.url_proveedor ?? null,
            }))}
          />

          <BotonCancelarPedido pedidoId={pedido.id} estadoActual={pedido.estado} />

          {/* Cronología */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cronología</h3>
            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Pedido creado:</span>{' '}
                {new Date(pedido.created_at).toLocaleString('es-CO')}
              </p>
              {pago && (
                <p>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Pago:</span> {pago.estado}{' '}
                  ({new Date(pago.created_at).toLocaleString('es-CO')})
                </p>
              )}
              {pedido.updated_at && pedido.updated_at !== pedido.created_at && (
                <p>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Última actualización:</span>{' '}
                  {new Date(pedido.updated_at).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
