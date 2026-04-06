'use server'

import { createClient } from '@/lib/supabase/server'
import { construirURLCheckout } from '@/lib/wompi/client'
import { procesarPedido } from '@/lib/services/pedidos.service'

type CrearPedidoResult =
  | { ok: true; pedidoId: string; urlPago: string }
  | { ok: false; error: string }

/**
 * Server Action — flujo de checkout con redirect a Wompi.
 * Thin wrapper sobre procesarPedido().
 */
export async function crearPedido(formData: FormData): Promise<CrearPedidoResult> {
  // Autenticación via cookies (contexto de Server Action)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let items: Array<{ productoId: string; cantidad: number; variante?: string }>
  try {
    const raw = formData.get('items')?.toString()
    items = raw ? JSON.parse(raw) : []
  } catch {
    return { ok: false, error: 'Campos incompletos' }
  }

  const result = await procesarPedido({
    nombre:       formData.get('nombre')?.toString().trim() ?? '',
    email:        formData.get('email')?.toString().trim() ?? '',
    telefono:     formData.get('telefono')?.toString().trim() ?? '',
    departamento: formData.get('departamento')?.toString().trim() ?? '',
    ciudad:       formData.get('ciudad')?.toString().trim() ?? '',
    direccion:    formData.get('direccion')?.toString().trim() ?? '',
    barrio:       formData.get('barrio')?.toString().trim() || null,
    indicaciones: formData.get('indicaciones')?.toString().trim() || null,
    guardarDireccion: formData.get('guardar_direccion') === 'true',
    items,
    userId: user?.id ?? null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  })

  if (!result.ok) return { ok: false, error: result.error }

  const urlPago = await construirURLCheckout({
    referencia:      result.referencia,
    montoEnCentavos: result.montoEnCentavos,
    redirectUrl:     result.redirectUrl,
    publicKey:       process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET!,
  })

  return { ok: true, pedidoId: result.pedidoId, urlPago }
}
