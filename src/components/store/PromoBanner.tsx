import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

interface PromoBannerProps {
  /** Overrides opcionales para reutilizar el componente */
  tag?: string
  titulo?: string
  descripcion?: string
  descuento?: string
  ctaLabel?: string
  ctaHref?: string
  imagen?: string
  imagenAlt?: string
}

export function PromoBanner({
  tag = 'Colección exclusiva',
  titulo = 'Audio que\ncambia todo',
  descripcion = 'Auriculares con cancelación de ruido activa, 30 h de autonomía y sonido que no encontrarás en otro lado.',
  descuento = '20% OFF',
  ctaLabel = 'Comprar ahora',
  ctaHref = '/productos',
  imagen = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  imagenAlt = 'Auriculares premium',
}: PromoBannerProps) {
  return (
    <section
      className="overflow-hidden bg-zinc-900 dark:bg-zinc-950"
      aria-label={`Promoción: ${tag}`}
    >
      <div className="mx-auto grid max-w-7xl items-stretch md:grid-cols-2">
        {/* ── Panel de texto ──────────────────────────────────────────────── */}
        <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          {/* Glow decorativo */}
          <div
            className="absolute left-0 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[100px]"
            aria-hidden="true"
          />

          {/* Grid punteado */}
          <div
            className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden="true"
          />

          <div className="relative">
            {/* Tag */}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              <Zap className="h-3 w-3" aria-hidden="true" />
              {tag}
            </span>

            {/* Título */}
            <h2 className="mt-5 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
              {titulo.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>

            {/* Descripción */}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              {descripcion}
            </p>

            {/* Badge descuento */}
            <div className="mt-6 inline-flex items-baseline gap-2">
              <span className="rounded-xl bg-amber-400/15 px-4 py-2 font-mono text-2xl font-black text-amber-400 sm:text-3xl">
                {descuento}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                en productos seleccionados
              </span>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 shadow-lg transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 hover:shadow-xl active:scale-95"
              >
                {ctaLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Panel de imagen ─────────────────────────────────────────────── */}
        <div className="relative min-h-[300px] overflow-hidden sm:min-h-[380px] md:min-h-0">
          <Image
            src={imagen}
            alt={imagenAlt}
            fill
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Fade lateral hacia el panel de texto (solo md+) */}
          <div
            className="absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-zinc-900 to-transparent md:block dark:from-zinc-950"
            aria-hidden="true"
          />
          {/* Overlay de tono para que la imagen no sea demasiado brillante */}
          <div className="absolute inset-0 bg-zinc-950/20" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
