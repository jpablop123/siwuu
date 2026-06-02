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
    .select('nombre, descripcion_corta, descripcion, imagenes, precio_venta')
    .eq('slug', params.slug)
    .single()

  if (!producto) return { title: 'Producto no encontrado' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siwuu.vercel.app'
  const url = `${baseUrl}/productos/${params.slug}`
  const imagen = producto.imagenes?.[0] ?? `${baseUrl}/og-default.png`
  const descripcion =
    producto.descripcion_corta ||
    producto.descripcion?.slice(0, 160) ||
    `${producto.nombre} con envío a toda Colombia. Pagá con tarjeta, PSE, Nequi.`

  return {
    title: producto.nombre,
    description: descripcion,
    keywords: [producto.nombre, 'comprar', 'Colombia', 'envío', 'accesorios celular'],
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: producto.nombre,
      description: descripcion,
      images: [{ url: imagen, alt: producto.nombre, width: 1200, height: 630 }],
      locale: 'es_CO',
      siteName: 'SiwuuShop',
    },
    twitter: {
      card: 'summary_large_image',
      title: producto.nombre,
      description: descripcion,
      images: [imagen],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
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

  // ── JSON-LD para SEO: Product + Offer + BreadcrumbList ────────────────────
  // Google lo lee para generar rich snippets (precio, stock, imagen) en SERP
  // y para listar en Google Shopping.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siwuu.vercel.app'
  const productoUrl = `${baseUrl}/productos/${p.slug}`
  const enStock = p.stock_virtual > 0

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion_corta || p.descripcion || p.nombre,
    image: p.imagenes && p.imagenes.length > 0 ? p.imagenes : [`${baseUrl}/og-default.png`],
    sku: p.id,
    brand: { '@type': 'Brand', name: 'SiwuuShop' },
    offers: {
      '@type': 'Offer',
      url: productoUrl,
      priceCurrency: 'COP',
      price: p.precio_venta,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: enStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'SiwuuShop' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CO' },
        shippingRate: { '@type': 'MonetaryAmount', value: '15000', currency: 'COP' },
      },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio',    item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${baseUrl}/productos` },
      ...(p.categoria
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: p.categoria.nombre,
            item: `${baseUrl}/categoria/${p.categoria.slug}`,
          }]
        : []),
      { '@type': 'ListItem', position: p.categoria ? 4 : 3, name: p.nombre, item: productoUrl },
    ],
  }

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
      {/* JSON-LD para Google: Product (rich snippets + Shopping) + Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
