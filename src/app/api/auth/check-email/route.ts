import { NextResponse } from 'next/server'
import { rlEmailCheck } from '@/lib/ratelimit'

/**
 * POST /api/auth/check-email
 * Body: { email: string }
 * Response: { hasAccount: boolean }
 *
 * Comprueba si el email tiene una cuenta registrada usando la Admin API de Supabase.
 * El checkout muestra un hint para iniciar sesión si el email ya existe —
 * nunca bloquea el pedido.
 */
export async function POST(request: Request) {
  try {
    const rl = await rlEmailCheck(request)
    if (!rl.ok) {
      return NextResponse.json({ hasAccount: false }, {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      })
    }

    const { email } = await request.json() as { email?: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ hasAccount: false })
    }

    // Admin API soporta filtro por email directamente
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email.toLowerCase())}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
      }
    )

    if (!res.ok) return NextResponse.json({ hasAccount: false })

    const data = await res.json() as { users?: unknown[] }
    return NextResponse.json({ hasAccount: (data.users?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ hasAccount: false })
  }
}
