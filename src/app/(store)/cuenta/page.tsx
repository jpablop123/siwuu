import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { EditarPerfilForm } from './EditarPerfilForm'

export const metadata: Metadata = {
  title: 'Mi perfil',
  robots: 'noindex',
}

interface Props {
  searchParams: { password?: string }
}

export default async function CuentaPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, telefono')
    .eq('id', user!.id)
    .single()

  const perfil = {
    nombre: (profile?.nombre as string) || '',
    telefono: (profile?.telefono as string) || '',
    email: user!.email || '',
  }

  return (
    <div>
      {searchParams.password === 'actualizado' && (
        <div className="mb-6 rounded-xl bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
          Contraseña actualizada correctamente
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mi perfil</h1>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Datos personales</h2>
        <EditarPerfilForm perfil={perfil} />
      </div>
    </div>
  )
}
