import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Package } from 'lucide-react'
import { TrackingBar } from './TrackingBar'
import type { Producto } from '@/types'

interface HeroDualProps {
  /** Producto real del catálogo para ilustrar el seguimiento. Opcional. */
  producto?: Producto | null
}

/**
 * Hero de la home — las dos formas de comprar, una al lado de la otra.
 *
 * Va sobre una "escena": luz azul sobre papel en modo día, azul noche profundo
 * en modo noche. Los dos registros son deliberados, no uno la versión apagada
 * del otro.
 *
 * Izquierda: la promesa y los dos caminos (catálogo / encargo desde USA).
 * Derecha: una guía de ejemplo con la barra de estados, que es la manera más
 * directa de mostrar en qué consiste el servicio.
 */
export function HeroDual({ producto }: HeroDualProps) {
  const imagen = producto?.imagenes?.[0]

  return (
    <section className="escena brasa relative overflow-hidden border-b border-ink-200 dark:border-ink-800">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-8">
        {/* ── Promesa ────────────────────────────────────────────── */}
        <div>
          <span className="sello">
            <span className="h-1.5 w-1.5 rounded-full bg-aduana-500" aria-hidden="true" />
            USA → Colombia
          </span>

          <h1 className="escena-ink mt-6 font-heading text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">
            Tus compras en USA,{' '}
            <span className="encendido">directo a tu casa</span>
          </h1>

          <p className="escena-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            Compra Apple y Samsung del catálogo o pídenos lo que quieras de cualquier
            tienda de Estados Unidos. Lo compramos allá y te lo traemos. Pagas en pesos,
            con la TRM del día.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/productos"
              className="halo-azul group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950"
            >
              Ver catálogo
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/pedido-usa"
              className="escena-line inline-flex items-center justify-center gap-2 rounded-2xl border bg-white/70 px-8 py-4 text-base font-bold text-ink-900 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-aduana-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aduana-500 focus-visible:ring-offset-2 dark:bg-white/10 dark:text-white dark:focus-visible:ring-offset-ink-950"
            >
              <Package className="h-5 w-5 text-aduana-500" aria-hidden="true" />
              Pídelo de USA
            </Link>
          </div>

          <p className="escena-muted mt-5 flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-brand-500 dark:text-brand-400" aria-hidden="true" />
            Pago seguro con Wompi — Nequi, PSE, Bancolombia y tarjetas.
          </p>
        </div>

        {/* ── Guía de ejemplo ────────────────────────────────────── */}
        <div className="relative">
          <div className="vidrio halo-azul overflow-hidden rounded-3xl">
            {/* Encabezado tipo etiqueta de envío */}
            <div className="escena-line flex items-center justify-between gap-3 border-b border-dashed px-5 py-4">
              <p className="escena-muted font-mono text-[10px] uppercase tracking-widest">
                Guía SIW-2481 · ejemplo
              </p>
              <span className="sello sello-azul">En vuelo</span>
            </div>

            <div className="flex items-center gap-4 px-5 py-6">
              <div className="escena-line relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border bg-white">
                {imagen ? (
                  <Image
                    src={imagen}
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="112px"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-300">
                    <Package className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="escena-muted font-mono text-[10px] uppercase tracking-widest">
                  Comprado en Miami
                </p>
                <p className="escena-ink mt-1.5 truncate font-heading text-xl font-extrabold">
                  {producto?.nombre ?? 'Tu pedido de Estados Unidos'}
                </p>
                <p className="escena-muted mt-1 text-sm">
                  Entrega estimada: 8 a 12 días hábiles
                </p>
              </div>
            </div>

            <div className="escena-line border-t bg-white/50 px-5 py-4 dark:bg-white/5">
              {/* Nombres cortos: dentro de la tarjeta no hay ancho para los largos */}
              <TrackingBar activo={1} estados={['Comprado', 'En vuelo', 'Aduana', 'En tu puerta']} />
            </div>
          </div>

          {/* Sello de importación, superpuesto al borde inferior para no tapar
              el número de guía del encabezado */}
          <div
            className="halo-naranja absolute -bottom-4 -left-3 rotate-[-8deg] rounded-md border-2 border-aduana-500 bg-white px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-aduana-600 dark:bg-ink-950 dark:text-aduana-400"
            aria-hidden="true"
          >
            Importado de USA
          </div>
        </div>
      </div>
    </section>
  )
}
