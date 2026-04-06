'use client'

/**
 * HeroBanner — carousel de hero dinámico.
 *
 * Si se pasan `slides` desde la DB (via page.tsx), los usa.
 * Si no hay slides o el array está vacío, cae al contenido estático de ejemplo.
 *
 * Comportamiento:
 * - Auto-avance cada 5 s, pausa en hover/focus.
 * - Fade suave (700 ms) + escala sutil.
 * - Dots + flechas prev/next (flechas solo ≥ lg).
 * - Barra de progreso animada en la base.
 * - Totalmente accesible: aria-live, role="tablist", teclado.
 */

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface HeroBannerSlide {
  id: string
  titulo: string
  subtitulo?: string | null
  tag?: string | null
  imagen_url: string
  cta_label: string
  cta_href: string
  cta_secundario_label?: string | null
  cta_secundario_href?: string | null
  align: 'left' | 'center'
}

interface HeroBannerProps {
  /** Slides provenientes de `tienda_banners`. Vacío → usa FALLBACK_SLIDES. */
  slides?: HeroBannerSlide[]
}

// ── Slides de ejemplo (se usan cuando la DB no tiene banners configurados) ────
//
// Unsplash — fotos de producto con fondos de estudio:
//   1505740420928-5e560c06d30e  Grado headphones sobre fondo oscuro (limpio)
//   23275335684-37898b6baf30    Apple Watch sobre superficie blanca (limpio)
//   57eed65a12eed-...-...       Laptop setup, dark desk  → reemplaza si prefieres

const FALLBACK_SLIDES: HeroBannerSlide[] = [
  {
    id: 'fallback-1',
    tag: 'Nuevos lanzamientos',
    titulo: 'Tecnología\nque te sigue',
    subtitulo: 'Auriculares, relojes inteligentes y accesorios premium con envío directo a tu puerta.',
    imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
    cta_label: 'Ver todo',
    cta_href: '/productos',
    cta_secundario_label: 'Categorías',
    cta_secundario_href: '/#categorias',
    align: 'left',
  },
  {
    id: 'fallback-2',
    tag: 'Colección Relojes',
    titulo: 'Estilo en\ncada segundo',
    subtitulo: 'Smartwatches y relojes analógicos para quienes no comprometen el diseño.',
    imagen_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1400&auto=format&fit=crop',
    cta_label: 'Explorar colección',
    cta_href: '/productos',
    cta_secundario_label: null,
    cta_secundario_href: null,
    align: 'left',
  },
  {
    id: 'fallback-3',
    tag: 'Setup & Productividad',
    titulo: 'Tu espacio,\ntu flow',
    subtitulo: 'Accesorios, periféricos y gadgets que elevan tu workspace al siguiente nivel.',
    imagen_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=1400&auto=format&fit=crop',
    cta_label: 'Descubrir',
    cta_href: '/productos',
    cta_secundario_label: null,
    cta_secundario_href: null,
    align: 'center',
  },
]

// ── Gradiente de overlay según align ─────────────────────────────────────────

const OVERLAY: Record<'left' | 'center', string> = {
  left:   'bg-gradient-to-r from-black/85 via-black/50 to-transparent',
  center: 'bg-gradient-to-t from-black/90 via-black/50 to-black/20',
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function HeroBanner({ slides: dbSlides }: HeroBannerProps) {
  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + slides.length) % slides.length),
    [slides.length],
  )

  // Auto-avance — se pausa en hover y en focus de controles
  useEffect(() => {
    if (paused || slides.length <= 1) return
    intervalRef.current = setInterval(next, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, next, slides.length])

  const slide = slides[Math.min(current, slides.length - 1)]
  const isCenter = slide.align === 'center'

  return (
    <section
      className="relative h-[72vh] min-h-[480px] max-h-[900px] w-full overflow-hidden bg-zinc-950"
      aria-label="Banner principal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Live region para lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {current + 1} de {slides.length}: {slide.titulo.replace(/\n/g, ' ')}
      </div>

      {/* ── Slides ───────────────────────────────────────────────────────── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1}: ${s.titulo.replace(/\n/g, ' ')}`}
          aria-hidden={i !== current}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-in-out',
            i === current ? 'z-10 scale-100 opacity-100' : 'z-0 scale-[1.04] opacity-0',
          )}
        >
          <Image
            src={s.imagen_url}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          {/* Overlay degradado para legibilidad del texto */}
          <div className={cn('absolute inset-0', OVERLAY[s.align])} aria-hidden="true" />

          {/* Contenido del slide */}
          <div className="absolute inset-0 flex items-center">
            <div
              className={cn(
                'mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12',
                isCenter && 'flex flex-col items-center text-center',
              )}
            >
              <div className={cn('max-w-lg', isCenter && 'max-w-2xl')}>
                {/* Tag */}
                {s.tag && (
                  <span className="inline-block rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-sm">
                    {s.tag}
                  </span>
                )}

                {/* Título */}
                <h2
                  className={cn(
                    'mt-4 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl xl:text-7xl',
                  )}
                >
                  {s.titulo.split('\n').map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
                </h2>

                {/* Subtítulo */}
                {s.subtitulo && (
                  <p className="mt-4 text-sm leading-relaxed text-zinc-200 drop-shadow sm:text-base lg:text-lg">
                    {s.subtitulo}
                  </p>
                )}

                {/* CTAs */}
                <div
                  className={cn(
                    'mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4',
                    isCenter && 'items-center justify-center',
                  )}
                >
                  <Link
                    href={s.cta_href}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 shadow-lg transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 hover:shadow-xl active:scale-95"
                  >
                    {s.cta_label}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                  {s.cta_secundario_label && s.cta_secundario_href && (
                    <Link
                      href={s.cta_secundario_href}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
                    >
                      {s.cta_secundario_label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Flechas (≥ lg, solo si hay más de 1 slide) ───────────────────── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:flex"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:flex"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* ── Dots ─────────────────────────────────────────────────────────── */}
      {slides.length > 1 && (
        <div
          role="tablist"
          aria-label="Seleccionar slide"
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              type="button"
              aria-selected={i === current}
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                i === current ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}

      {/* ── Barra de progreso ────────────────────────────────────────────── */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 z-20 h-[2px] w-full bg-white/10" aria-hidden="true">
          <div
            key={`${current}-${paused}`}
            className="h-full bg-emerald-400"
            style={{ animation: paused ? 'none' : 'hero-progress 5s linear forwards' }}
          />
        </div>
      )}

      <style>{`
        @keyframes hero-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  )
}
