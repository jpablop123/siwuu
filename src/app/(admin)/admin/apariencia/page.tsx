import { createServiceClient } from '@/lib/supabase/server'
import { BannersManager } from './BannersManager'
import { PromoForm } from './PromoForm'
import type { Metadata } from 'next'
import { ImageIcon, Megaphone, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Apariencia - Admin',
  robots: 'noindex',
}

export default async function AdminAparienciaPage() {
  const supabase = createServiceClient()

  const [bannersRes, configRes, trmRes] = await Promise.all([
    supabase
      .from('tienda_banners')
      .select('*')
      .order('orden')
      .order('created_at'),
    supabase
      .from('tienda_configuracion')
      .select('*')
      .single(),
    supabase
      .from('config_trm' as never)
      .select('trm, trm_spread, margen_pct, trm_updated_at')
      .single(),
  ])

  const trm = trmRes.data as
    | { trm: number; trm_spread: number; margen_pct: number; trm_updated_at: string | null }
    | null
  const cop = (n: number) => '$' + Math.round(n).toLocaleString('es-CO')

  const banners = (bannersRes.data as Array<{
    id: string
    titulo: string
    subtitulo: string | null
    tag: string | null
    imagen_url: string
    cta_label: string
    cta_href: string
    cta_secundario_label: string | null
    cta_secundario_href: string | null
    align: 'left' | 'center'
    activo: boolean
    orden: number
    created_at: string
  }>) || []

  const config = configRes.data ?? {
    promo_tag: 'Colección exclusiva',
    promo_titulo: 'Audio que cambia todo',
    promo_descripcion: null,
    promo_descuento: '20% OFF',
    promo_cta_label: 'Comprar ahora',
    promo_cta_href: '/productos',
    promo_imagen: null,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Apariencia de la tienda
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestiona el hero carousel y el banner promocional sin tocar código.
        </p>
      </div>

      <div className="space-y-8">
        {/* ── TRM del día ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                TRM del día
              </h2>
              <p className="text-xs text-zinc-500">
                Tasa con la que se calculan los precios en COP. Se actualiza sola cada día.
              </p>
            </div>
          </div>

          {trm ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'TRM oficial', value: cop(trm.trm) },
                  { label: '+ Compra (spread)', value: cop(trm.trm_spread) },
                  { label: 'Tasa efectiva', value: cop(trm.trm + trm.trm_spread), strong: true },
                  { label: 'Margen', value: `${trm.margen_pct}%` },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl border p-4 ${s.strong ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950'}`}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{s.label}</p>
                    <p className={`mt-1 text-lg font-bold ${s.strong ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              {trm.trm_updated_at && (
                <p className="mt-3 text-xs text-zinc-500">
                  Última actualización: {new Date(trm.trm_updated_at).toLocaleString('es-CO')}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              No disponible. Corre la migración de <code>config_trm</code> para activar la TRM automática.
            </p>
          )}
        </section>

        {/* ── Sección 1: Hero Banners ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
              <ImageIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Hero carousel
              </h2>
              <p className="text-xs text-zinc-500">
                Los slides activos aparecen en la parte superior de la tienda, ordenados por el campo &quot;Orden&quot;.
                {banners.length === 0 && ' Sin banners, se muestran los slides de ejemplo.'}
              </p>
            </div>
          </div>

          <BannersManager banners={banners} />
        </section>

        {/* ── Sección 2: Promo Banner ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
              <Megaphone className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Banner promocional
              </h2>
              <p className="text-xs text-zinc-500">
                Aparece a mitad de la página, entre los nuevos lanzamientos y los destacados.
              </p>
            </div>
          </div>

          <PromoForm config={config} />
        </section>
      </div>
    </div>
  )
}
