'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * vincularPedidosHuerfanos
 *
 * Asigna al usuario autenticado todos los pedidos que compró como invitado
 * (user_id IS NULL) usando el mismo correo electrónico verificado.
 *
 * Seguridad:
 * - Verifica identidad con el cliente anon (auth.getUser es confiable).
 * - Solo actúa si el email está verificado en Supabase Auth.
 * - El UPDATE usa el service client para bypasear la RLS de UPDATE
 *   (que solo permite admins), pero la condición WHERE garantiza que
 *   solo se tocan filas que aún no tienen dueño.
 * - Es completamente idempotente: reruns son no-ops.
 */
export async function vincularPedidosHuerfanos(): Promise<{ vinculados: number }> {
  // 1. Obtener usuario autenticado desde el cliente anon (nunca confiar en cookies sin verificar)
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { vinculados: 0 }

  // 2. Solo proceder si el email está verificado — evita que alguien reclame
  //    pedidos de un correo que no controla (edge case: email sin confirmar)
  if (!user.email_confirmed_at) return { vinculados: 0 }

  const email = user.email
  if (!email) return { vinculados: 0 }

  // 3. UPDATE masivo con service role para bypasear la RLS de UPDATE
  //    Condición doble: email exacto + user_id IS NULL
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('pedidos')
    .update({ user_id: user.id })
    .eq('email_cliente', email)
    .is('user_id', null)
    .select('id')

  if (error) {
    // Fallo silencioso — no queremos romper la página por esto
    console.error('[vincularPedidosHuerfanos] error:', error.message)
    return { vinculados: 0 }
  }

  return { vinculados: data?.length ?? 0 }
}

/**
 * convertirInvitadoAUsuario
 *
 * Registra al comprador invitado usando el email con el que pagó.
 * Usa auth.signUp() del cliente anon (respeta la config del proyecto:
 * confirm-email o auto-confirm).
 *
 * Detección de email ya registrado: Supabase devuelve `identities: []`
 * cuando "prevent email enumeration" está activo, sin exponer un error.
 * Lo manejamos explícitamente para dar feedback útil al usuario.
 */
export async function convertirInvitadoAUsuario(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Validaciones mínimas antes de llamar a Supabase
  if (!email || !password) {
    return { ok: false, error: 'Email y contraseña son requeridos.' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // Errores reales: contraseña débil, rate limit, etc.
    return { ok: false, error: error.message }
  }

  // Cuando "prevent email enumeration" está activo y el email ya existe,
  // Supabase devuelve user con identities vacío en lugar de un error.
  if (data.user && data.user.identities?.length === 0) {
    return {
      ok: false,
      error: 'Este email ya tiene una cuenta. Inicia sesión para ver tus pedidos.',
    }
  }

  return { ok: true }
}
