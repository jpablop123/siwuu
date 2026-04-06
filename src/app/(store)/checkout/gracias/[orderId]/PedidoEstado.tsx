'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Price } from '@/components/store/Price'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/types'
import { PostCheckoutRegister } from './PostCheckoutRegister'

type PedidoConItems = Pedido & { items: PedidoItem[] }

interface Props {
  pedidoInicial: PedidoConItems
  /** true cuando el acceso fue validado por cookie de invitado (no por user_id) */
  isGuest?: boolean
}

export function PedidoEstado({ pedidoInicial, isGuest = false }: Props) {
  const [pedido, setPedido] = useState<PedidoConItems>(pedidoInicial)
  const [timeout, setTimeoutReached] = useState(false)

  const confirmado = pedido.estado === 'pago_confirmado' ||
    pedido.estado === 'procesando' ||
    pedido.estado === 'enviado_proveedor' ||
    pedido.estado === 'en_camino' ||
    pedido.estado === 'entregado'

  useEffect(() => {
    if (confirmado) return

    const supabase = createClient()

    const channel = supabase
      .channel(`pedido-${pedido.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedido.id}`,
        },
        (payload) => {
          setPedido((prev) => ({ ...prev, ...(payload.new as Pedido) }))
        }
      )
      .subscribe()

    // Timeout a los 30 segundos
    const timer = setTimeout(() => setTimeoutReached(true), 30_000)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timer)
    }
  }, [pedido.id, confirmado])

  // Estado: confirmando pago
  if (!confirmado && !timeout) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-emerald-400" />
        <h1 className="mt-6 text-2xl font-bold">Confirmando tu pago...</h1>
        <p className="mt-2 text-zinc-500">
          Estamos verificando tu transacción. Esto solo toma unos segundos.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          Pedido <span className="font-mono font-bold">{pedido.numero}</span>
        </p>
      </div>
    )
  }

  // Estado: timeout (pago puede estar pendiente o fallido)
  if (!confirmado && timeout) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-amber-400" />
        <h1 className="mt-6 text-2xl font-bold">Verificación en proceso</h1>
        <p className="mt-2 text-zinc-500">
          La confirmación está tardando más de lo esperado. Tu pago puede estar siendo procesado.
        </p>
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-6 py-4">
          <p className="text-sm text-amber-300">
            Guarda tu número de pedido:{' '}
            <span className="font-mono font-bold text-amber-200">{pedido.numero}</span>
          </p>
          <p className="mt-1 text-xs text-amber-400">
            Te notificaremos por email cuando el pago sea confirmado.
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/cuenta/pedidos"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/productos"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    )
  }

  // Estado: pago confirmado
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-20 w-20 text-emerald-400" />
      <h1 className="mt-6 text-3xl font-bold">¡Gracias por tu compra!</h1>
      <p className="mt-2 text-zinc-500">Tu pago fue confirmado exitosamente.</p>

      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-6 text-left">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4">
          <div>
            <p className="text-xs text-zinc-500">Número de pedido</p>
            <p className="font-mono text-lg font-bold">{pedido.numero}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Total</p>
            <Price amount={pedido.total} className="text-lg font-bold" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {pedido.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                {item.nombre_producto} ×{item.cantidad}
                {item.variante && (
                  <span className="ml-1 text-zinc-500">({item.variante})</span>
                )}
              </span>
              <Price amount={item.subtotal} className="font-medium" />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4 text-sm text-zinc-500">
          <p>Envío a: {pedido.direccion_envio}, {pedido.ciudad}</p>
        </div>
      </div>

      {/* CTA de registro — solo para invitados, una vez confirmado el pago */}
      {isGuest && (
        <PostCheckoutRegister email={pedido.email_cliente} />
      )}

      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/productos"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Seguir comprando
        </Link>
        <Link
          href="/cuenta/pedidos"
          className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Ver mis pedidos
        </Link>
      </div>
    </div>
  )
}
