import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

// El admin siempre se renderiza en runtime (datos en vivo, detrás de auth).
// Evita que el build intente prerenderizar y llamar a la BD sin env.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Admin — SiwuuShop',
    template: '%s | Admin SiwuuShop',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <AdminSidebar />
      {/* Offset del sidebar en desktop, sin offset en mobile */}
      <main className="min-h-screen pt-14 lg:pl-64 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
