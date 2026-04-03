import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Lee/escribe cookies de autenticación vía next/headers.
 *
 * IMPORTANTE: llamar a createClient() DENTRO de cada request —
 * nunca almacenar en una variable de módulo (las cookies cambian por request).
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde un Server Component de solo lectura — ignorar.
            // Las cookies solo se pueden escribir desde Server Actions o Route Handlers.
          }
        },
      },
    }
  )
}

/**
 * Cliente con Service Role para operaciones administrativas server-side
 * que necesitan bypass de RLS (webhooks, crons, migraciones).
 * NUNCA exponer al browser.
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
