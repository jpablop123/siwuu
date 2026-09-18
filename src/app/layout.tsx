import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { CartDrawer } from '@/components/store/CartDrawer'
import { ToastContainer } from '@/components/ui/Toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthCartSync } from '@/components/AuthCartSync'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** Titulares de la marca — dirección "Aduana". */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

/** Solo para datos: guías, etiquetas, sellos. Nunca para precios ni botones. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SiwuuShop',
    template: '%s | SiwuuShop',
  },
  description:
    'Siwuu (Ship It With Us): compra tecnología Apple y Samsung en nuestra tienda o pídenos lo que quieras de cualquier tienda de Estados Unidos. Pagas en pesos y te lo entregamos en la puerta de tu casa, en toda Colombia.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [{ url: '/brand/siwuu-favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/siwuu-isotipo.svg' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Tema antes del primer pintado, para que no haya parpadeo.
            La marca es clara por defecto: el catálogo son fotos sobre blanco. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('siwuu-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthCartSync />
          {children}
          <CartDrawer />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}
