/**
 * Sitemap dinámico para Google / Bing / Yandex.
 *
 * Servido en /sitemap.xml. Next 14 lo genera automáticamente al detectar
 * este archivo. Re-genera cada hora gracias a `revalidate` (ISR).
 *
 * Incluye:
 *   - Rutas estáticas (home, productos, terminos, etc.)
 *   - Cada producto activo (con su slug)
 *   - Cada categoría activa
 *
 * Para que Google lo lea: configurar en Search Console
 * (https://search.google.com/search-console) como sitemap.
 */

import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siwuu.vercel.app'

  let productos: MetadataRoute.Sitemap = []
  let categorias: MetadataRoute.Sitemap = []

  try {
    const supabase = createServiceClient()
    const [productosRes, categoriasRes] = await Promise.all([
      supabase.from('productos').select('slug, updated_at').eq('activo', true),
      supabase.from('categorias').select('slug').eq('activa', true),
    ])

    productos = (productosRes.data ?? []).map((p) => ({
      url: `${baseUrl}/productos/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    categorias = (categoriasRes.data ?? []).map((c) => ({
      url: `${baseUrl}/categoria/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Sin env (ej. build): devolvemos solo las rutas estáticas; el ISR
    // (revalidate 1h) repuebla productos/categorías en runtime.
  }

  const rutasEstaticas: MetadataRoute.Sitemap = [
    { url: baseUrl,                        priority: 1.0, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/productos`,         priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/terminos`,          priority: 0.3, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/politica-privacidad`, priority: 0.3, changeFrequency: 'monthly', lastModified: new Date() },
  ]

  return [...rutasEstaticas, ...categorias, ...productos]
}
