/**
 * Constantes de marca Siwuu.
 *
 * Los textos que el admin puede editar viven en `tienda_configuracion` (CMS).
 * Acá quedan solo los valores que no cambian por pedido ni por campaña.
 */

/** Eslogan oficial — de acá sale el nombre: Ship It With Us → SIWUU. */
export const ESLOGAN = 'Ship it with us'

/** WhatsApp por defecto. El del CMS (footer_whatsapp) siempre tiene prioridad. */
export const WHATSAPP_FALLBACK = '573001234567'

/** Los cuatro estados por los que pasa un pedido traído de USA. */
export const ESTADOS_ENVIO = [
  'Comprado en USA',
  'En vuelo a Colombia',
  'En aduana',
  'En tu puerta',
] as const

/** Tiendas de USA en las que compramos por encargo. */
export const TIENDAS_USA = [
  'Amazon',
  'Apple',
  'Best Buy',
  'Walmart',
  'Nike',
  'eBay',
  'Target',
  'B&H Photo',
  'Sephora',
  'Costco',
] as const

/**
 * Construye un enlace de WhatsApp con mensaje prellenado.
 * @param numero  número en formato internacional sin signos (ej. 573001234567)
 * @param mensaje texto que aparece escrito al abrir el chat
 */
export function waLink(numero: string | null | undefined, mensaje: string): string {
  const n = (numero || WHATSAPP_FALLBACK).replace(/\D/g, '')
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`
}
