import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Cliente de Supabase para Client Components (browser).
 * Singleton: reutiliza la misma instancia en toda la sesión del navegador
 * para evitar crear múltiples GoTrue clients y listeners duplicados.
 */
export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
