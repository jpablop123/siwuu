/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'swipvkzxqtxpruftszsq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HSTS — fuerza HTTPS por 2 años con preload
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Anti-clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Bloquea MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Mínimo referrer leak entre origins
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Bloquea acceso a APIs sensibles del browser que no usamos
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
