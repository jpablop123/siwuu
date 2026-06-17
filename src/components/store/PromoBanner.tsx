import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Plane, ShieldCheck, MapPin } from 'lucide-react'

interface PromoBannerProps {
  /** Overrides opcionales (vienen de tienda_configuracion) */
  tag?: string
  titulo?: string
  descripcion?: string
  descuento?: string
  ctaLabel?: string
  ctaHref?: string
  imagen?: string
  imagenAlt?: string
}

const PRODUCTO_DEMO =
  'https://swipvkzxqtxpruftszsq.supabase.co/storage/v1/object/public/productos_imagenes/seed/iphone-17-pro-max-1.webp'

export function PromoBanner({
  tag = 'Lo último de Apple',
  titulo = 'iPhone 17 Pro,\ndirecto desde USA',
  descripcion = 'Tu personal shopper en Estados Unidos: compra lo último y te lo llevamos a Colombia, con la TRM del día.',
  ctaLabel = 'Ver iPhone',
  ctaHref = '/categoria/celulares',
  imagen,
  imagenAlt = 'Producto destacado',
}: PromoBannerProps) {
  const img = imagen || PRODUCTO_DEMO

  return (
    <section className="px-4 py-10 sm:py-14" aria-label={`Destacado: ${tag}`}>
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl bg-zinc-900 shadow-xl md:grid-cols-2 dark:bg-zinc-900">
        {/* ── Texto ──────────────────────────────────────────────── */}
        <div className="relative flex flex-col justify-center px-7 py-12 sm:px-10 sm:py-14 lg:px-14">
          <div
            className="pointer-events-none absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              {tag}
            </span>

            <h2 className="mt-5 font-heading text-3xl font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
              {titulo.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              {descripcion}
            </p>

            {/* Value props (en vez de un descuento falso) */}
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-zinc-300">
              <li className="flex items-center gap-1.5"><Plane className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Desde USA</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Pago seguro</li>
              <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Entrega en tu puerta</li>
            </ul>

            <div className="mt-8">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Imagen: producto real sobre fondo claro ────────────── */}
        <div className="relative min-h-[280px] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 sm:min-h-[360px] md:min-h-0">
          <Image
            src={img}
            alt={imagenAlt}
            fill
            className="object-contain p-8 transition-transform duration-700 hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  )
}
