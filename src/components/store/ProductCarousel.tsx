'use client'

/**
 * ProductCarousel — fila horizontal deslizable de productos.
 *
 * - Mobile: scroll nativo con snap, sin flechas.
 * - Desktop (≥ lg): flechas prev/next que hacen scrollBy().
 * - Reutiliza ProductCard para consistencia visual.
 * - Sin dependencias JS externas — 100% CSS snap + scrollBy.
 */

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'
import type { Producto } from '@/types'

interface ProductCarouselProps {
  productos: Producto[]
  titulo: string
  subtitulo?: string
  verTodosHref?: string
  accentColor?: 'emerald' | 'violet' | 'amber'
}

const SCROLL_AMOUNT = 320 // px por clic de flecha

export function ProductCarousel({
  productos,
  titulo,
  subtitulo,
  verTodosHref = '/productos',
  accentColor = 'emerald',
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const accentClasses = {
    emerald: 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500 hover:text-zinc-950',
    violet:  'text-violet-500 border-violet-500/50 bg-violet-500/10 hover:bg-violet-500 hover:text-white',
    amber:   'text-amber-500 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950',
  }

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [productos])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: 'smooth',
    })
  }

  if (productos.length === 0) return null

  return (
    <section className="py-12 sm:py-16" aria-labelledby={`carousel-heading-${titulo}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-6 flex items-end justify-between sm:mb-8">
          <div>
            {subtitulo && (
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                {subtitulo}
              </p>
            )}
            <h2
              id={`carousel-heading-${titulo}`}
              className="mt-1 font-heading text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl"
            >
              {titulo}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Flechas — solo desktop */}
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  canScrollLeft
                    ? 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300'
                    : 'border-zinc-200 text-zinc-300 opacity-40 cursor-not-allowed dark:border-zinc-800 dark:text-zinc-600',
                )}
                aria-label="Productos anteriores"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  canScrollRight
                    ? 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300'
                    : 'border-zinc-200 text-zinc-300 opacity-40 cursor-not-allowed dark:border-zinc-800 dark:text-zinc-600',
                )}
                aria-label="Más productos"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Ver todos */}
            <Link
              href={verTodosHref}
              className={cn(
                'group hidden items-center gap-1.5 rounded-xl border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all sm:flex',
                accentClasses[accentColor],
              )}
            >
              Ver todos
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Carrusel — overflow izquierdo/derecho visible para dar "hint" del siguiente */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <div
            ref={scrollRef}
            role="list"
            aria-label={titulo}
            className="flex gap-4 overflow-x-auto scroll-smooth px-4 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-6 lg:px-8"
          >
            {productos.map((producto) => (
              <div
                key={producto.id}
                role="listitem"
                className="snap-start shrink-0 w-[240px] sm:w-[268px] lg:w-[280px]"
              >
                <ProductCard producto={producto} />
              </div>
            ))}

            {/* Card "Ver todos" al final */}
            <div className="snap-start shrink-0 w-[180px] sm:w-[200px] flex items-center justify-center">
              <Link
                href={verTodosHref}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 px-6 py-8 text-center transition-all hover:border-emerald-500/50 dark:border-zinc-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                  <ArrowRight className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-emerald-500">
                  Ver todos
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Ver todos — mobile */}
        <div className="mt-4 text-center sm:hidden">
          <Link
            href={verTodosHref}
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400"
          >
            Ver todos los productos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
