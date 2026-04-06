import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verificar CRON_SECRET de Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const hace30min = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Obtener pedidos expirados con sus items para restaurar stock
  const { data: pedidosExpirados, error } = await supabase
    .from('pedidos')
    .select('id, numero')
    .eq('estado', 'pendiente')
    .lt('created_at', hace30min)

  if (error) {
    console.error('Cron expirar-pedidos error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!pedidosExpirados?.length) {
    return NextResponse.json({ expirados: 0 })
  }

  const ids = pedidosExpirados.map((p) => p.id)

  // Restaurar stock de cada pedido y marcar como expirado en paralelo
  await Promise.all([
    // Restaurar stock via función SQL atómica
    ...ids.map((id) => supabase.rpc('restaurar_stock', { p_pedido_id: id })),
    // Marcar pedidos como expirados
    supabase
      .from('pedidos')
      .update({ estado: 'expirado', updated_at: new Date().toISOString() })
      .in('id', ids),
    // Marcar pagos pendientes como expirados
    supabase
      .from('pagos')
      .update({ estado: 'expirado' })
      .in('pedido_id', ids)
      .eq('estado', 'pendiente'),
  ])

  console.log(`Cron: ${ids.length} pedidos expirados:`, ids)

  return NextResponse.json({ expirados: ids.length })
}
