'use client'

/**
 * ProductGallery — galería interactiva de imágenes del producto.
 *
 * Features:
 * - Imagen principal con fade suave al cambiar
 * - Miniaturas clickeables con anillo de selección
 * - Swipe horizontal en móvil (touch nativo, sin dependencias)
 * - Navegación con teclado (← →) cuando la galería tiene foco
 * - Fallback con icono cuando no hay imágenes
 */

import Image from 'next/image'
import { useState, useRef, useCallback } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  imagenes: string[]
  nombre: string
}

const SWIPE_THRESHOLD = 50   // px mínimos para considerar un swipe

export function ProductGallery({ imagenes, nombre }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [fading, setFading] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // ── Cambio de imagen con fade ─────────────────────────────────────────────

  const goTo = useCallback(
    (index: number) => {
      if (index === selected || index < 0 || index >= imagenes.length) return
      setFading(true)
      // Esperar que la opacidad llegue a 0 antes de cambiar la imagen
      setTimeout(() => {
        setSelected(index)
        setFading(false)
      }, 150)
    },
    [selected, imagenes.length]
  )

  // ── Touch swipe ───────────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    goTo(delta < 0 ? selected + 1 : selected - 1)
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(selected + 1)
    if (e.key === 'ArrowLeft')  goTo(selected - 1)
  }

  // ── Sin imágenes ──────────────────────────────────────────────────────────

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-12 w-12" aria-hidden="true" />
          <span className="text-sm">Sin imagen</span>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="sticky top-24 space-y-3 sm:space-y-4">
      {/* Imagen principal */}
      <div
        role="img"
        aria-label={`${nombre} — imagen ${selected + 1} de ${imagenes.length}`}
        tabIndex={imagenes.length > 1 ? 0 : -1}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800"
      >
        <Image
          src={imagenes[selected]}
          alt={`${nombre} — vista ${selected + 1}`}
          fill
          className={cn(
            'object-contain p-4 transition-all duration-150 group-hover:scale-105',
            fading ? 'opacity-0' : 'opacity-100'
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Indicador de posición en móvil (solo si hay > 1 imagen) */}
        {imagenes.length > 1 && (
          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden"
            aria-hidden="true"
          >
            {imagenes.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === selected
                    ? 'w-4 bg-emerald-500'
                    : 'w-1.5 bg-zinc-300 dark:bg-zinc-600'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — solo en pantallas ≥ sm */}
      {imagenes.length > 1 && (
        <div
          role="group"
          aria-label="Miniaturas de imágenes"
          className="hidden gap-2 sm:flex sm:gap-3"
        >
          {imagenes.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 sm:h-20 sm:w-20',
                i === selected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 opacity-70 hover:border-zinc-400 hover:opacity-100 dark:border-zinc-700 dark:hover:border-zinc-500'
              )}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === selected}
            >
              <Image
                src={img}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
