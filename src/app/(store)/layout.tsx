import type { Metadata } from 'next'
import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'SiwuuShop — Tu tienda online en Colombia',
    template: '%s | SiwuuShop',
  },
  description:
    'Los mejores productos con envío a toda Colombia a los mejores precios.',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SiwuuShop',
  },
}

async function getUserProfile() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('nombre, rol')
      .eq('id', user.id)
      .single()

    return {
      nombre: profile?.nombre ?? user.email?.split('@')[0] ?? 'Usuario',
      email: user.email ?? '',
      rol: profile?.rol ?? 'cliente',
    }
  } catch {
    return null
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserProfile()

  return (
    <>
      <Navbar user={user} />
      <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      <Footer />
    </>
  )
}
