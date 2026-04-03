import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegistroForm } from './RegistroForm'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: 'noindex',
}

export default async function RegistroPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/cuenta')

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-zinc-950">
            S
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Crear cuenta</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Regístrate para hacer seguimiento a tus pedidos
          </p>
        </div>

        <RegistroForm />
      </div>
    </div>
  )
}
