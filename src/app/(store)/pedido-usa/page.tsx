import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Link2, Plane, PackageCheck } from 'lucide-react'
import { CotizadorForm } from './CotizadorForm'
import { TrackingBar } from '@/components/store/TrackingBar'
import { StoresMarquee } from '@/components/store/StoresMarquee'
import { ReglasEncargo } from '@/components/store/ReglasEncargo'
import { Faq } from '@/components/store/Faq'
import { FAQ_ENCARGOS } from '@/lib/encargos'
import { getTiendaConfig } from '@/lib/cache/cms'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Pídelo de USA — encargos desde Estados Unidos',
  description:
    'Pega el link de Amazon, Best Buy, Nike o cualquier tienda de Estados Unidos y te cotizamos el precio final en pesos, puesto en la puerta de tu casa en Colombia.',
  alternates: { canonical: '/pedido-usa' },
}

const PASOS = [
  {
    Icon: Link2,
    titulo: 'Mándanos el link',
    detalle: 'De Amazon, Best Buy, Walmart, Nike, eBay o la tienda gringa que sea.',
  },
  {
    Icon: PackageCheck,
    titulo: 'Te cotizamos en pesos',
    detalle: 'Precio final con envío e impuestos incluidos. Si te sirve, pagas; si no, no pasa nada.',
  },
  {
    Icon: Plane,
    titulo: 'Lo compramos y lo traemos',
    detalle: 'Lo compramos en Estados Unidos y llega a tu puerta en 8 a 12 días hábiles.',
  },
]

export default async function PedidoUsaPage() {
  const config = await getTiendaConfig()
  const whatsapp = config?.footer_whatsapp

  return (
    <>
      {/* ── Encabezado ─────────────────────────────────────────── */}
      <section className="escena brasa relative overflow-hidden border-b border-ink-200 dark:border-ink-800">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <span className="sello">Personal shopper</span>
          <h1 className="escena-ink mt-6 max-w-3xl font-heading text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.03em] text-balance sm:text-6xl">
            ¿No está en el catálogo?{' '}
            <span className="text-aduana-600 dark:text-aduana-400">Te lo traemos igual</span>
          </h1>
          <p className="escena-muted mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Pega el link de lo que quieres de cualquier tienda de Estados Unidos. Nosotros lo
            compramos allá, hacemos el trámite de aduana y te lo entregamos en tu casa.
            Tú no necesitas tarjeta internacional ni casillero.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PASOS.map(({ Icon, titulo, detalle }, i) => (
              <div key={titulo} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aduana-50 text-aduana-600 dark:bg-aduana-500/15 dark:text-aduana-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    Paso 0{i + 1}
                  </p>
                  <p className="escena-ink mt-0.5 font-bold">{titulo}</p>
                  <p className="escena-muted mt-1 text-sm leading-relaxed">{detalle}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="escena-line mt-10 border-t pt-6">
            <TrackingBar />
          </div>
        </div>
      </section>

      <StoresMarquee />

      {/* ── Cotizador ──────────────────────────────────────────── */}
      <section className="bg-hueso py-16 sm:py-20" aria-labelledby="cotizador-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Cotizador</p>
            <h2
              id="cotizador-heading"
              className="mt-3 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-ink-900 text-balance sm:text-5xl dark:text-white"
            >
              Calcula cuánto te cuesta puesto en tu casa
            </h2>
            <p className="mt-3 text-base text-ink-600 dark:text-ink-300">
              Con el precio en dólares y el peso aproximado te damos un estimado al instante.
              Lo confirmamos por WhatsApp antes de que pagues.
            </p>
          </div>

          <div className="mt-10">
            <CotizadorForm whatsapp={whatsapp} />
          </div>
        </div>
      </section>

      {/* ── Condiciones, celulares y prohibidos ────────────────── */}
      <ReglasEncargo />

      {/* ── Preguntas propias del servicio ─────────────────────── */}
      <Faq
        items={FAQ_ENCARGOS}
        titulo="Preguntas sobre los pedidos especiales"
        intro="Si lo tuyo es un caso distinto, escríbenos por WhatsApp: cotizar no cuesta nada."
      />

      {/* ── Puente al catálogo ─────────────────────────────────── */}
      <section className="bg-white py-14 dark:bg-ink-950">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="font-heading text-xl font-bold text-ink-900 dark:text-white">
              ¿Buscas un iPhone o un Mac?
            </h2>
            <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-300">
              Eso ya está en el catálogo, con el precio final calculado y sin que tengas que cotizar nada.
            </p>
          </div>
          <Link
            href="/productos"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}
