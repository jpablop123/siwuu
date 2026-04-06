import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PedidoEstado } from './PedidoEstado'
import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/types'

interface Props {
  params: { orderId: string }
}

export default async function GraciasPage({ params }: Props) {
  const serviceClient = createServiceClient()
  const supabase = createClient()

  const [{ data: pedido }, { data: { user } }] = await Promise.all([
    serviceClient
      .from('pedidos')
      .select('*, items:pedido_items(*)')
      .eq('id', params.orderId)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!pedido) {
    return <PedidoNoEncontrado />
  }

  // ── Validación de acceso ─────────────────────────────────────────────
  //
  // Caso 1: usuario autenticado propietario del pedido.
  // Caso 2: invitado cuya cookie contiene el token_acceso exacto
  //         generado en BD al crear el pedido (UUID criptográfico,
  //         NO simplemente la presencia de la cookie).
  //
  // Cualquier otro caso → 404 genérico (no revela si el pedido existe).
  // ─────────────────────────────────────────────────────────────────────
  const cookieStore = cookies()
  const guestCookie = cookieStore.get(`guest_pedido_${params.orderId}`)

  const esOwner   = !!user && pedido.user_id === user.id
  const esInvitado =
    !pedido.user_id &&
    !!guestCookie?.value &&
    guestCookie.value === pedido.token_acceso   // ← comparación exacta del token

  if (!esOwner && !esInvitado) {
    return <PedidoNoEncontrado />
  }

  return (
    <PedidoEstado
      pedidoInicial={pedido as Pedido & { items: PedidoItem[] }}
      isGuest={esInvitado}
    />
  )
}

function PedidoNoEncontrado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
      <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
