import type { Metadata } from 'next'
import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { createClient } from '@/lib/supabase/server'
import { getTiendaConfig } from '@/lib/cache/cms'

export const metadata: Metadata = {
  title: {
    default: 'SiwuuShop — Tienda online y personal shopper en USA',
    template: '%s | SiwuuShop',
  },
  description:
    'Siwuu (Ship It With Us): compra en nuestra tienda online o pídenos lo que quieras desde Estados Unidos con nuestro servicio de personal shopper. Te lo llevamos a Colombia.',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SiwuuShop',
  },
}

/**
 * Lee al usuario del JWT en cookies **sin hacer network call**.
 *
 * Antes esta función llamaba `getUser()` (valida con Supabase Auth server,
 * ~150ms RT) + un query a `profiles` (~150ms RT) en CADA página del store.
 * Ese overhead fijo lo pagaban todas las páginas, incluso las públicas para
 * usuarios deslogueados.
 *
 * Ahora:
 * - `getSession()` lee la cookie localmente → 0 ms de red.
 * - `nombre` viene de `user_metadata` (lo setea handle_new_user trigger).
 * - `rol` viene de `app_metadata` (sincronizado por trigger 011).
 *
 * Tradeoff: si el cliente cambia su `nombre` via /cuenta, el navbar muestra
 * el nombre del JWT hasta que el token se refresque (~1h). Aceptable.
 * Las rutas protegidas (/cuenta, /admin) siguen validando con getUser() en
 * el middleware — la seguridad no cambia.
 */
async function getUserFromSession() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { user } = session
    const nombreMeta = user.user_metadata?.nombre as string | undefined
    const rolMeta    = user.app_metadata?.rol as string | undefined

    return {
      nombre: nombreMeta ?? user.email?.split('@')[0] ?? 'Usuario',
      email:  user.email ?? '',
      rol:    rolMeta ?? 'cliente',
    }
  } catch {
    return null
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [user, config] = await Promise.all([getUserFromSession(), getTiendaConfig()])

  return (
    <>
      <Navbar user={user} />
      <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      <Footer config={config} />
    </>
  )
}
