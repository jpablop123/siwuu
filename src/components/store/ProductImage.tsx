'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  className?: string
  priority?: boolean
}

/**
 * Wrapper sobre next/image con fallback placeholder para imágenes rotas o ausentes.
 * Usar en cualquier lugar donde se muestre imagen de producto.
 */
export function ProductImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
}: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${className ?? ''}`}
        aria-label={alt}
      >
        <ImageIcon className="h-1/3 max-h-12 w-1/3 max-w-12 text-zinc-300 dark:text-zinc-600" />
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 400}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
