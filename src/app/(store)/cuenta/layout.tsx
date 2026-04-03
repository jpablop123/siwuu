import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CuentaSidebar } from './CuentaSidebar'

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/cuenta')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const perfil = {
    nombre: (profile?.nombre as string) || 'Usuario',
    email: user.email || '',
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <CuentaSidebar perfil={perfil} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
