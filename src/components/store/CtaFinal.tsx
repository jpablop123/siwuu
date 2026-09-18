import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/brand'
import { TrackingBar } from './TrackingBar'

/**
 * Cierre de la home: los dos caminos otra vez, ahora con WhatsApp al lado.
 * En Colombia WhatsApp es el canal donde se resuelve la desconfianza.
 */
export function CtaFinal({ whatsapp }: { whatsapp?: string | null }) {
  return (
    <section className="bg-white py-16 sm:py-20 dark:bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="escena brasa halo-azul relative overflow-hidden rounded-[2rem] border border-ink-200 px-7 py-14 sm:px-14 sm:py-20 dark:border-ink-800">
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />

          <div className="relative max-w-2xl">
            <span className="sello">Ship it with us</span>
            <h2 className="escena-ink mt-6 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl">
              ¿Listo para estrenar?
            </h2>
            <p className="escena-muted mt-4 text-base sm:text-lg">
              Compra del catálogo o mándanos el link de lo que quieres de Estados Unidos.
              Te decimos cuánto cuesta puesto en tu casa, en pesos y sin sorpresas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/productos"
                className="halo-azul group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Ver catálogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/pedido-usa"
                className="escena-line escena-ink inline-flex items-center justify-center gap-2 rounded-2xl border bg-white/70 px-8 py-4 text-base font-bold backdrop-blur transition-all hover:-translate-y-0.5 hover:border-aduana-500 dark:bg-white/10"
              >
                Cotizar un encargo
              </Link>
              <a
                href={waLink(whatsapp, 'Hola Siwuu, quiero preguntar por un producto de Estados Unidos.')}
                target="_blank"
                rel="noopener noreferrer"
                className="escena-muted inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold transition-colors hover:text-brand-600 dark:hover:text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Escríbenos por WhatsApp
              </a>
            </div>

            <div className="escena-line mt-12 border-t pt-7">
              <TrackingBar />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
