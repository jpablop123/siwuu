import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/store/ProductGrid'
import { Price } from '@/components/store/Price'
import { ShieldCheck, Truck, RefreshCw, ArrowRight, Star, Zap, Package, CreditCard } from 'lucide-react'
import type { Producto, Categoria } from '@/types'

export default async function HomePage() {
  const supabase = createClient()

  const [categoriasRes, destacadosRes] = await Promise.all([
    supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('orden'),
    supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('destacado', true)
      .limit(8),
  ])

  const categorias = (categoriasRes.data as Categoria[]) || []
  const destacados = (destacadosRes.data as Producto[]) || []
  const heroProduct = destacados[0] || null

  return (
    <>
      {/* Hero Split */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950">
        {/* Glows */}
        <div className="absolute right-1/4 top-0 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-emerald-500 opacity-[0.07] blur-[150px]" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/2 rounded-full bg-violet-500 opacity-[0.05] blur-[120px]" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12 md:py-24 lg:px-8 lg:py-32">
          {/* Left — Text */}
          <div className="order-2 text-center md:order-1 md:text-left">
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400 sm:px-4 sm:py-1.5 sm:text-xs">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              Envios a toda Colombia
            </span>

            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:mt-6 sm:text-5xl lg:text-7xl">
              Lo mejor en
              <br />
              <span className="text-gradient">tech & estilo</span>
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-lg md:mx-0">
              Productos originales con envio directo a tu puerta.
              Pago seguro y precios que no encontraras en otro lado.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center md:justify-start">
              <Link
                href="/productos"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 shadow-button transition-all hover:bg-emerald-400 hover:shadow-glow-lg sm:px-8 sm:py-4"
              >
                Ver catalogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              {categorias.length > 0 && (
                <Link
                  href={`/categoria/${categorias[0].slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-600 transition-all hover:border-emerald-500/50 hover:text-emerald-400 dark:border-zinc-700 dark:text-zinc-400 sm:px-8 sm:py-4"
                >
                  {categorias[0].nombre}
                </Link>
              )}
            </div>

            {/* Trust pills — ocultas en mobile, visibles en sm+ */}
            <div className="mt-8 hidden flex-wrap justify-center gap-3 sm:flex md:justify-start md:gap-4 lg:mt-10">
              {[
                { icon: Truck, text: 'Envio gratis +$150k' },
                { icon: ShieldCheck, text: 'Pago 100% seguro' },
                { icon: RefreshCw, text: 'Garantia incluida' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Featured Product */}
          {heroProduct && (
            <Link href={`/productos/${heroProduct.slug}`} className="group relative order-1 mx-auto w-full max-w-xs sm:max-w-sm md:order-2 md:max-w-none">
              {/* Glow behind product */}
              <div className="absolute inset-4 rounded-3xl bg-emerald-500/20 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/30 group-hover:blur-[60px]" aria-hidden="true" />

              <div className="relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white shadow-2xl transition-all duration-300 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_60px_rgba(52,211,153,0.15)] dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-3xl">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-white sm:aspect-square">
                  {heroProduct.imagenes[0] && (
                    <Image
                      src={heroProduct.imagenes[0]}
                      alt={heroProduct.nombre}
                      fill
                      className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 80vw, 50vw"
                      priority
                    />
                  )}
                  {/* Badge */}
                  <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                    <span className="flex items-center gap-1 rounded-lg bg-violet-500 px-2 py-1 font-mono text-[10px] font-bold text-white shadow-lg sm:px-3 sm:py-1.5 sm:text-xs">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      DESTACADO
                    </span>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-4 sm:p-5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                    {heroProduct.tags?.[0] || 'Producto'}
                  </p>
                  <h3 className="mt-1 font-heading text-base font-bold text-zinc-900 dark:text-white sm:text-lg">
                    {heroProduct.nombre}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <Price amount={heroProduct.precio_venta} className="font-mono text-xl font-bold text-emerald-400 sm:text-2xl" />
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-zinc-950 sm:px-4 sm:py-2 sm:text-xs">
                      Ver producto
                      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Beneficios strip */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800 md:grid-cols-4">
          {[
            { icon: Truck, title: 'Envio nacional', desc: 'A toda Colombia' },
            { icon: CreditCard, title: 'Pago seguro', desc: 'Wompi certificado' },
            { icon: Package, title: 'Productos originales', desc: '100% garantizados' },
            { icon: Zap, title: 'Soporte rapido', desc: 'Respuesta en 24h' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-2 px-3 py-4 sm:gap-3 sm:px-6 md:py-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 sm:h-10 sm:w-10 sm:rounded-xl">
                <Icon className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white sm:text-sm">{title}</p>
                <p className="hidden text-xs text-zinc-500 sm:block">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="bg-white py-16 dark:bg-zinc-950" aria-labelledby="categorias-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 id="categorias-title" className="font-heading text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              Explora por categoria
            </h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
              Encuentra lo que buscas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white transition-all duration-300 hover:border-emerald-500/50 hover:shadow-card-hover dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="aspect-[4/3]">
                  {cat.imagen_url && (
                    <Image
                      src={cat.imagen_url}
                      alt={cat.nombre}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-3 sm:p-4">
                    <h3 className="font-heading text-base font-bold text-white sm:text-lg">
                      {cat.nombre}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                      Ver productos
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-16 dark:border-zinc-700 dark:bg-zinc-900/50" aria-labelledby="destacados-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
                  Destacados
                </span>
              </div>
              <h2 id="destacados-title" className="font-heading text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
                Los mas vendidos
              </h2>
            </div>
            <Link
              href="/productos"
              className="group hidden items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:text-emerald-300 sm:flex"
            >
              Ver todos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <ProductGrid productos={destacados} />
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500/50 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/10"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Newsletter */}
      <section className="relative overflow-hidden border-t border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(52,211,153,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Zap className="h-7 w-7 text-emerald-400" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
            No te pierdas ningun drop
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Descuentos exclusivos, nuevos productos y ofertas que solo enviamos por email
          </p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Correo electronico
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="tu@email.com"
              required
              className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-6 py-3.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-glow"
            >
              Suscribirme
            </button>
          </form>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Sin spam. Solo lo bueno.
          </p>
        </div>
      </section>
    </>
  )
}
