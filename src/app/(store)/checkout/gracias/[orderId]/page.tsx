import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PedidoEstado } from './PedidoEstado'
import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/types'

interface Props {
  params: { orderId: string }
}

export default async function GraciasPage({ params }: Props) {
  // Usar service client para leer el pedido sin restricción de RLS.
  // La validación de acceso se hace manualmente abajo.
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
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
        <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  // Validación de acceso:
  // 1. Usuario autenticado que es dueño del pedido
  // 2. Invitado que tiene la cookie httpOnly del pedido
  const cookieStore = cookies()
  const guestCookie = cookieStore.get(`guest_pedido_${params.orderId}`)

  const esOwner = user && pedido.user_id === user.id
  const esInvitado = !pedido.user_id && !!guestCookie

  if (!esOwner && !esInvitado) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
        <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <PedidoEstado pedidoInicial={pedido as Pedido & { items: PedidoItem[] }} />
  )
}
