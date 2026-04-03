import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstadoPedido } from '@/types'

// ---------------------------------------------------------------------------
// Tailwind class merge (preparación para shadcn/ui)
// ---------------------------------------------------------------------------

/**
 * Combina class names con soporte para condicionales (clsx)
 * y resolución de conflictos de Tailwind (tailwind-merge).
 *
 * @example cn('px-4 py-2', isActive && 'bg-blue-600', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Formato de moneda colombiana
// ---------------------------------------------------------------------------

/**
 * Formatea un número como moneda colombiana (COP) sin decimales.
 * Usa puntos como separador de miles según la convención colombiana.
 *
 * @example formatCOP(125000) → "$125.000"
 * @example formatCOP(0) → "$0"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

/**
 * Convierte un texto a slug URL-safe.
 * Elimina acentos, convierte a minúsculas, reemplaza espacios/especiales con guiones.
 *
 * @example slugify("Audífonos Bluetooth Pro") → "audifonos-bluetooth-pro"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------------------
// Cálculo de descuento
// ---------------------------------------------------------------------------

/**
 * Calcula el porcentaje de descuento entre precio de venta y precio tachado.
 *
 * @example calcularDescuento(89900, 129900) → 31
 * @returns Porcentaje entero (0–100), o 0 si no hay descuento válido
 */
export function calcularDescuento(precioVenta: number, precioTachado: number): number {
  if (!precioTachado || precioTachado <= precioVenta) return 0
  return Math.round(((precioTachado - precioVenta) / precioTachado) * 100)
}

// ---------------------------------------------------------------------------
// Estados de pedido
// ---------------------------------------------------------------------------

interface EstadoConfig {
  label: string
  color: string
}

export const ESTADOS_PEDIDO: Record<EstadoPedido, EstadoConfig> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  pago_confirmado: { label: 'Pago confirmado', color: 'bg-green-100 text-green-800' },
  procesando: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
  enviado_proveedor: { label: 'Enviado al proveedor', color: 'bg-purple-100 text-purple-800' },
  en_camino: { label: 'En camino', color: 'bg-indigo-100 text-indigo-800' },
  entregado: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
} as const

/**
 * Orden de los estados para validación de transiciones.
 * Un pedido solo puede avanzar (no retroceder), excepto 'cancelado'.
 */
export const ORDEN_ESTADOS: EstadoPedido[] = [
  'pendiente',
  'pago_confirmado',
  'procesando',
  'enviado_proveedor',
  'en_camino',
  'entregado',
]

// ---------------------------------------------------------------------------
// Constantes de envío
// ---------------------------------------------------------------------------

/** Monto mínimo en COP para envío gratuito */
export const COSTO_ENVIO_GRATIS_DESDE = 150_000

/** Costo fijo de envío en COP cuando no aplica envío gratis */
export const COSTO_ENVIO = 12_000

/**
 * Calcula el costo de envío según el subtotal del pedido.
 */
export function calcularEnvio(subtotal: number): number {
  return subtotal >= COSTO_ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO
}
