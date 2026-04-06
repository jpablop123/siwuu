const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/**
 * Convierte un path relativo de Supabase Storage en una URL pública.
 * Si ya es una URL completa, la retorna tal cual.
 *
 * Uso: getPublicImageUrl('productos/mi-imagen.jpg')
 *      getPublicImageUrl('https://....supabase.co/...') // pasthrough
 */
export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`
}
