import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: 'noindex',
}

interface Props {
  searchParams: { redirectTo?: string; error?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    redirect(profile?.rol === 'admin' ? '/admin' : '/cuenta')
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <div className="w-full">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-zinc-950">
            S
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresa a tu cuenta para ver tus pedidos
          </p>
        </div>

        <LoginForm
          redirectTo={searchParams.redirectTo}
          linkError={searchParams.error === 'invalid_link'}
        />
      </div>
    </div>
  )
}
