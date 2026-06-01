'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { enviarEmailBienvenida } from '@/lib/resend/emails'
import { rlAuth } from '@/lib/ratelimit'
import { registroSchema, flattenErrors } from '@/lib/validators/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function extractIp(h: Headers): string | null {
  return h.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? h.get('x-real-ip')
    ?? null
}

export async function registrarse(
  formData: FormData
): Promise<{ ok?: boolean; fieldErrors?: Record<string, string>; error?: string }> {
  const h = headers()
  const rl = await rlAuth(h)
  if (!rl.ok) return { error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }

  // ── Validación con schema compartido ──────────────────────────────
  const parsed = registroSchema.safeParse({
    nombre:             formData.get('nombre')?.toString() ?? '',
    email:              formData.get('email')?.toString() ?? '',
    telefono:           formData.get('telefono')?.toString() ?? '',
    password:           formData.get('password')?.toString() ?? '',
    confirmarPassword:  formData.get('confirmarPassword')?.toString() ?? '',
    aceptaTerminos:     formData.get('aceptaTerminos')?.toString() ?? '',
    aceptaPrivacidad:   formData.get('aceptaPrivacidad')?.toString() ?? '',
    website:            formData.get('website')?.toString() ?? '',
  })

  if (!parsed.success) {
    // Honeypot lleno → respondemos como si fuera registro exitoso
    // pero sin hacer nada. El bot no sabe que lo detectamos.
    const fieldErrors = flattenErrors(parsed.error)
    if (fieldErrors.website) return { ok: true }
    return { fieldErrors }
  }

  const { nombre, email, telefono, password } = parsed.data

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    // No exponer mensajes específicos de Supabase (pueden filtrar info).
    console.error('[registrarse] signUp error:', error.message)
    return { error: 'No pudimos crear la cuenta. Verificá los datos e intentá de nuevo.' }
  }

  // ── Anti-enumeración ──────────────────────────────────────────────
  //
  // Cuando el email ya existe, Supabase no devuelve error: devuelve
  // un user con `identities` vacío y NO manda email de confirmación.
  // Antes acá devolvíamos "Ya existe una cuenta con ese email" — eso
  // permite enumerar el padrón de clientes. Ahora respondemos `ok: true`
  // igual que un registro nuevo. El usuario legítimo que ya tiene
  // cuenta no recibe email — para él el flujo es invisible.
  if (data.user?.identities?.length === 0) {
    return { ok: true }
  }

  // ── Persistir teléfono + evidencia de consentimiento ──────────────
  //
  // El trigger `handle_new_user` ya creó la fila en profiles con el
  // nombre del raw_user_meta_data. Le agregamos los datos extra.
  if (data.user) {
    const now = new Date().toISOString()
    const serviceClient = createServiceClient()
    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
        telefono,
        accepted_tos_at:     now,
        accepted_privacy_at: now,
        consent_ip:          extractIp(h),
      })
      .eq('id', data.user.id)

    if (profileError) {
      console.error('[registrarse] no se pudo persistir consentimiento:', profileError.message)
      // No bloqueamos el signup — la cuenta ya existe en auth.users.
      // El flag NULL en profiles le permite a un job de cleanup
      // detectar esto y pedir reconsentimiento en el próximo login.
    }
  }

  // Email de bienvenida — best effort
  try {
    await enviarEmailBienvenida({ email, nombre })
  } catch (emailError) {
    console.error('Error enviando email de bienvenida:', emailError)
  }

  return { ok: true }
}

export async function iniciarSesion(
  formData: FormData
): Promise<{ error?: string }> {
  const rl = await rlAuth(headers())
  if (!rl.ok) return { error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }

  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const redirectTo = formData.get('redirectTo')?.toString() || ''

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Email o contraseña incorrectos' }

  // Si hay redirectTo explícito, validar que sea una ruta relativa (previene open redirect)
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  // Si no, redirigir según rol
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('rol')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')
  redirect(profile?.rol === 'admin' ? '/admin' : '/cuenta')
}

export async function cerrarSesion(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function recuperarPassword(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const rl = await rlAuth(headers())
  if (!rl.ok) return { ok: false, error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }

  const email = formData.get('email')?.toString().trim() ?? ''

  if (!EMAIL_REGEX.test(email)) return { ok: false, error: 'Email inválido' }

  const supabase = createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/cuenta/nueva-password`,
  })

  // Nunca revelar si el email existe o no
  return { ok: true }
}

export async function actualizarPassword(
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get('password')?.toString() ?? ''
  const confirmarPassword = formData.get('confirmarPassword')?.toString() ?? ''

  if (password.length < 10) return { error: 'La contraseña debe tener al menos 10 caracteres' }
  if (password.length > 128) return { error: 'La contraseña es demasiado larga' }
  if (password !== confirmarPassword) return { error: 'Las contraseñas no coinciden' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  revalidatePath('/cuenta')
  redirect('/cuenta?password=actualizado')
}

export async function actualizarPerfil(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const telefono = formData.get('telefono')?.toString().trim() ?? ''

  if (nombre.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ nombre, telefono: telefono || null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/cuenta')
  return { ok: true }
}

export async function agregarDireccion(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const nombreDestinatario = formData.get('nombre_destinatario')?.toString().trim() ?? ''
  const telefono = formData.get('telefono')?.toString().trim() ?? ''
  const ciudad = formData.get('ciudad')?.toString().trim() ?? ''
  const departamento = formData.get('departamento')?.toString().trim() ?? ''
  const direccion = formData.get('direccion')?.toString().trim() ?? ''
  const barrio = formData.get('barrio')?.toString().trim() || null
  const indicaciones = formData.get('indicaciones')?.toString().trim() || null

  if (!nombreDestinatario || !telefono || !ciudad || !departamento || !direccion) {
    return { error: 'Campos requeridos incompletos' }
  }

  const { count } = await supabase
    .from('direcciones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { error } = await supabase.from('direcciones').insert({
    user_id: user.id,
    nombre_destinatario: nombreDestinatario,
    telefono,
    ciudad,
    departamento,
    direccion,
    barrio,
    indicaciones,
    principal: (count ?? 0) === 0,
  })

  if (error) return { error: error.message }

  revalidatePath('/cuenta/direcciones')
  return { ok: true }
}

export async function eliminarDireccion(
  id: string
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('direcciones')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/cuenta/direcciones')
  return { ok: true }
}

export async function marcarDireccionPrincipal(
  id: string
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verificar que la dirección pertenece al usuario
  const { data: dir } = await supabase
    .from('direcciones')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!dir) return { error: 'Dirección no encontrada' }

  // Desmarcar todas
  await supabase
    .from('direcciones')
    .update({ principal: false })
    .eq('user_id', user.id)

  // Marcar la seleccionada
  await supabase
    .from('direcciones')
    .update({ principal: true })
    .eq('id', id)

  revalidatePath('/cuenta/direcciones')
  return { ok: true }
}
