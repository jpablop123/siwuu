'use server'

/**
 * Server actions para gestión de cupones desde el admin.
 *
 * Patrón: replicamos la verificación admin que ya usa admin.ts.
 * No re-implementamos isAdmin acá — usamos el mismo helper para
 * mantener una sola fuente de verdad.
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cuponInputSchema } from '@/lib/validators/cupones'
import { flattenErrors } from '@/lib/validators/auth'

async function verificarAdmin() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')

  const serviceClient = createServiceClient()
  const { data: perfil } = await serviceClient
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') throw new Error('No autorizado')
  return { supabase: serviceClient, user }
}

// ── Crear ─────────────────────────────────────────────────────────────────────

export async function crearCupon(
  formData: FormData,
): Promise<{ ok?: boolean; fieldErrors?: Record<string, string>; error?: string }> {
  const { supabase } = await verificarAdmin()

  const parsed = cuponInputSchema.safeParse({
    codigo:              formData.get('codigo')?.toString() ?? '',
    tipo:                formData.get('tipo')?.toString() ?? '',
    valor:               formData.get('valor')?.toString() ?? '',
    minimo_compra:       formData.get('minimo_compra')?.toString() ?? '',
    usos_maximos:        formData.get('usos_maximos')?.toString() ?? '',
    expira_en:           formData.get('expira_en')?.toString() ?? '',
    inicia_en:           formData.get('inicia_en')?.toString() ?? '',
    descuento_maximo:    formData.get('descuento_maximo')?.toString() ?? '',
    categoria_id:        formData.get('categoria_id')?.toString() ?? '',
    solo_primera_compra: formData.get('solo_primera_compra')?.toString() ?? '',
    un_uso_por_cliente:  formData.get('un_uso_por_cliente')?.toString() ?? '',
    activo:              formData.get('activo')?.toString() ?? 'true',
  })

  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error) }
  }

  const { error } = await supabase.from('cupones').insert({
    codigo:              parsed.data.codigo,
    tipo:                parsed.data.tipo,
    valor:               parsed.data.valor,
    minimo_compra:       parsed.data.minimo_compra,
    usos_maximos:        parsed.data.usos_maximos,
    expira_en:           parsed.data.expira_en,
    inicia_en:           parsed.data.inicia_en,
    descuento_maximo:    parsed.data.descuento_maximo,
    categoria_id:        parsed.data.categoria_id,
    solo_primera_compra: parsed.data.solo_primera_compra ?? false,
    un_uso_por_cliente:  parsed.data.un_uso_por_cliente ?? false,
    activo:              parsed.data.activo ?? true,
  })

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { codigo: 'Ya existe un cupón con ese código' } }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/cupones')
  return { ok: true }
}

// ── Actualizar ─────────────────────────────────────────────────────────────────

export async function actualizarCupon(
  id: string,
  formData: FormData,
): Promise<{ ok?: boolean; fieldErrors?: Record<string, string>; error?: string }> {
  const { supabase } = await verificarAdmin()

  const parsed = cuponInputSchema.safeParse({
    codigo:              formData.get('codigo')?.toString() ?? '',
    tipo:                formData.get('tipo')?.toString() ?? '',
    valor:               formData.get('valor')?.toString() ?? '',
    minimo_compra:       formData.get('minimo_compra')?.toString() ?? '',
    usos_maximos:        formData.get('usos_maximos')?.toString() ?? '',
    expira_en:           formData.get('expira_en')?.toString() ?? '',
    inicia_en:           formData.get('inicia_en')?.toString() ?? '',
    descuento_maximo:    formData.get('descuento_maximo')?.toString() ?? '',
    categoria_id:        formData.get('categoria_id')?.toString() ?? '',
    solo_primera_compra: formData.get('solo_primera_compra')?.toString() ?? '',
    un_uso_por_cliente:  formData.get('un_uso_por_cliente')?.toString() ?? '',
    activo:              formData.get('activo')?.toString() ?? 'true',
  })

  if (!parsed.success) {
    return { fieldErrors: flattenErrors(parsed.error) }
  }

  const { error } = await supabase
    .from('cupones')
    .update({
      codigo:              parsed.data.codigo,
      tipo:                parsed.data.tipo,
      valor:               parsed.data.valor,
      minimo_compra:       parsed.data.minimo_compra,
      usos_maximos:        parsed.data.usos_maximos,
      expira_en:           parsed.data.expira_en,
      inicia_en:           parsed.data.inicia_en,
      descuento_maximo:    parsed.data.descuento_maximo,
      categoria_id:        parsed.data.categoria_id,
      solo_primera_compra: parsed.data.solo_primera_compra ?? false,
      un_uso_por_cliente:  parsed.data.un_uso_por_cliente ?? false,
      activo:              parsed.data.activo ?? true,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/cupones')
  return { ok: true }
}

// ── Toggle activo (acción rápida) ─────────────────────────────────────────────

export async function toggleCuponActivo(
  id: string,
  activo: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  const { error } = await supabase
    .from('cupones')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/cupones')
  return { ok: true }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

export async function eliminarCupon(
  id: string,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await verificarAdmin()

  // Si el cupón fue usado, mejor desactivar que borrar (preserva FK en pedidos).
  const { count } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cupon_id', id)

  if ((count ?? 0) > 0) {
    return { error: 'Este cupón ya fue usado. Desactivalo en lugar de eliminarlo.' }
  }

  const { error } = await supabase.from('cupones').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/cupones')
  return { ok: true }
}
