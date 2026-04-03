import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Direccion } from '@/types'
import { DireccionesClient } from './DireccionesClient'

export const metadata: Metadata = {
  title: 'Mis direcciones',
  robots: 'noindex',
}

export default async function DireccionesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: direcciones } = await supabase
    .from('direcciones')
    .select('*')
    .eq('user_id', user!.id)
    .order('principal', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">Mis direcciones</h1>
      <DireccionesClient direcciones={(direcciones as Direccion[]) || []} />
    </div>
  )
}
