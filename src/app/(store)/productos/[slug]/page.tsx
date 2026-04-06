import { createClient } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/store/ProductGallery'
import { ProductGrid } from '@/components/store/ProductGrid'
import { AddToCartForm } from './AddToCartForm'
import { Badge } from '@/components/ui/Badge'
import { calcularDescuento } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Producto, Variante, Categoria } from '@/types'
import Link from 'next/link'
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react'

interface Props {
  params: { slug: string }
}

type ProductoConJoins = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'> | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre, descripcion_corta, imagenes')
    .eq('slug', params.slug)
    .single()

  if (!producto) return { title: 'Producto no encontrado' }

  return {
    title: producto.nombre,
    description: producto.descripcion_corta || undefined,
    openGraph: {
      images: producto.imagenes?.[0] ? [producto.imagenes[0]] : [],
    },
  }
}

export default async function ProductoPage({ params }: Props) {
  const supabase = createClient()

  const { data: producto } = await supabase
    .from('productos')
    .select('*, categoria:categorias(nombre, slug), variantes(*)')
    .eq('slug', params.slug)
    .eq('activo', true)
    .single()

  if (!producto) notFound()

  const p = producto as ProductoConJoins
  const variantes = (p.variantes as Variante[]) || []
  const descuento = p.precio_tachado
    ? calcularDescuento(p.precio_venta, p.precio_tachado)
    : 0

  // Productos relacionados de la misma categoría
  const { data: relacionados } = p.categoria_id
    ? await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .eq('categoria_id', p.categoria_id)
        .neq('id', p.id)
        .limit(4)
    : { data: null }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="text-zinc-500 transition-colors hover:text-emerald-400">
          Inicio
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
        <Link href="/productos" className="text-zinc-500 transition-colors hover:text-emerald-400">
          Productos
        </Link>
        {p.categoria && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
            <Link
              href={`/categoria/${p.categoria.slug}`}
              className="text-zinc-500 transition-colors hover:text-emerald-400"
            >
              {p.categoria.nombre}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{p.nombre}</span>
      </nav>

      {/* Layout dos columnas */}
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Izquierda: Galería */}
        <ProductGallery imagenes={p.imagenes} nombre={p.nombre} />

        {/* Derecha: Info */}
        <div>
          {/* Badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {p.categoria && (
              <Badge variant="brand">{p.categoria.nombre}</Badge>
            )}
            {p.destacado && (
              <Badge variant="warning">
                <Star className="mr-1 h-3 w-3 fill-current" aria-hidden="true" />
                Destacado
              </Badge>
            )}
            {descuento > 0 && (
              <Badge variant="danger">🔥 -{descuento}% OFF</Badge>
            )}
          </div>

          {/* Nombre */}
          <h1 className="font-heading text-2xl font-bold text-zinc-900 dark:text-white lg:text-3xl">
            {p.nombre}
          </h1>

          {/* Descripción corta */}
          {p.descripcion_corta && (
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {p.descripcion_corta}
            </p>
          )}

          {/* Precios */}
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <Price amount={p.precio_venta} className="font-mono text-3xl font-bold text-emerald-500" />
              {p.precio_tachado && descuento > 0 && (
                <Price amount={p.precio_tachado} className="font-mono text-lg text-zinc-400 line-through" />
              )}
            </div>
            {p.precio_tachado && descuento > 0 && (
              <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Ahorras{' '}
                <span className="font-bold">
                  <Price amount={p.precio_tachado - p.precio_venta} className="inline" />
                </span>{' '}
                en esta compra
              </p>
            )}
          </div>

          {/* Separador */}
          <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800" />

          {/* Formulario de agregar al carrito (variantes + cantidad + botón) */}
          <AddToCartForm producto={p} variantes={variantes} />

          {/* Trust signals */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, text: 'Envio nacional' },
              { icon: ShieldCheck, text: 'Pago seguro' },
              { icon: RotateCcw, text: 'Garantia' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Icon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{text}</span>
              </div>
            ))}
          </div>

          {/* Descripción completa */}
          {p.descripcion && (
            <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Descripcion
              </h2>
              <div className="prose prose-sm max-w-none prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-emerald-400 text-zinc-700 dark:text-zinc-300">
                {p.descripcion}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados && relacionados.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800" aria-labelledby="relacionados-title">
          <h2
            id="relacionados-title"
            className="mb-6 font-heading text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl"
          >
            Tambien te puede interesar
          </h2>
          <ProductGrid productos={relacionados as Producto[]} />
        </section>
      )}
    </div>
  )
}
