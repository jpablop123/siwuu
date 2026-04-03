'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'

interface ProductImagesProps {
  imagenes: string[]
  nombre: string
}

export function ProductImages({ imagenes, nombre }: ProductImagesProps) {
  const [selected, setSelected] = useState(0)

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-12 w-12" aria-hidden="true" />
          <span className="text-sm">Sin imagen</span>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-24 space-y-3 sm:space-y-4">
      {/* Imagen principal */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800">
        <Image
          src={imagenes[selected]}
          alt={`${nombre} — imagen ${selected + 1} de ${imagenes.length}`}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="flex gap-2 sm:gap-3" role="group" aria-label="Galería de imágenes">
          {imagenes.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20',
                selected === i
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
              )}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={selected === i}
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
