/**
 * /robots.txt — instrucciones para crawlers.
 *
 * Bloqueamos las rutas privadas (admin, cuenta, checkout, APIs internas)
 * para no desperdiciar crawl budget de Google en páginas que no aportan SEO.
 * Apuntamos al sitemap dinámico de /sitemap.xml.
 */

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siwuu.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/cuenta/',
          '/checkout/',
          '/api/',
          '/login',
          '/registro',
          '/recuperar-password',
          '/auth/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
