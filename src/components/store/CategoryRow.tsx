import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Categoria } from '@/types'

interface CategoryRowProps {
  categorias: Categoria[]
}

/** Gradientes de fallback cuando la categoría no tiene imagen */
const FALLBACKS = [
  'from-violet-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-fuchsia-500 to-purple-700',
]

export function CategoryRow({ categorias }: CategoryRowProps) {
  if (categorias.length === 0) return null

  return (
    <section
      id="categorias"
      className="bg-white py-12 dark:bg-zinc-950 sm:py-16"
      aria-labelledby="categorias-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              Explorar
            </p>
            <h2
              id="categorias-heading"
              className="mt-1 font-heading text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl"
            >
              Comprar por categoría
            </h2>
          </div>
          <Link
            href="/productos"
            className="group hidden items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-emerald-500 dark:text-zinc-400 sm:flex"
          >
            Ver todo
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Fila scrollable */}
        <div
          role="list"
          className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 xl:grid-cols-6"
        >
          {categorias.map((cat, i) => {
            const gradient = FALLBACKS[i % FALLBACKS.length]
            return (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                role="listitem"
                className="group relative shrink-0 w-[160px] sm:w-[180px] lg:w-auto"
                aria-label={`Categoría: ${cat.nombre}`}
              >
                {/* Tarjeta */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-zinc-200 transition-all duration-300 group-hover:border-emerald-500/60 group-hover:shadow-lg dark:border-zinc-700">
                  {cat.imagen_url ? (
                    <>
                      <Image
                        src={cat.imagen_url}
                        alt={cat.nombre}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                        sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    </>
                  ) : (
                    <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)}>
                      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px]" />
                    </div>
                  )}

                  {/* Texto */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="font-heading text-sm font-bold text-white sm:text-base">
                      {cat.nombre}
                    </h3>
                    <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-300 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
                      Explorar
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Ver todo — solo mobile */}
        <div className="mt-5 text-center lg:hidden">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400"
          >
            Ver todas las categorías
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
