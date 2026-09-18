import Link from 'next/link'
import { ArrowRight, Check, Link2, ShoppingBag } from 'lucide-react'

/**
 * Las dos formas de comprar con Siwuu, al mismo nivel.
 *
 * Es la sección que resuelve el problema de fondo del sitio anterior: el
 * servicio de encargo desde USA se prometía en los textos pero no existía
 * en la navegación. Acá los dos modelos tienen el mismo peso visual.
 */

const TIENDA = {
  etiqueta: 'Precio cerrado',
  titulo: 'Compra del catálogo',
  descripcion:
    'Apple y Samsung ya seleccionados, con el precio final calculado. Eliges, pagas en pesos y nosotros lo compramos en Estados Unidos y te lo traemos.',
  bullets: [
    'Precio en pesos con la TRM del día',
    'Impuestos y envío nacional ya incluidos',
    'Pagas con Nequi, PSE, Bancolombia o tarjeta',
  ],
  cta: 'Ver catálogo',
  href: '/productos',
}

const ENCARGO = {
  etiqueta: 'Personal shopper',
  titulo: 'Pídenos lo que quieras de USA',
  descripcion:
    'Pega el link de Amazon, Best Buy, Nike o la tienda que sea. Nosotros lo compramos en Estados Unidos, lo traemos y te lo entregamos.',
  bullets: [
    'No necesitas tarjeta internacional',
    'Nosotros hacemos el trámite de aduana',
    'Cotización en pesos antes de que pagues',
  ],
  cta: 'Cotizar mi encargo',
  href: '/pedido-usa',
}

export function DosModelos() {
  return (
    <section className="bg-hueso py-16 sm:py-20" aria-labelledby="modelos-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Dos formas de comprar</p>
          <h2
            id="modelos-heading"
            className="mt-2 font-heading text-3xl font-extrabold text-ink-900 text-balance sm:text-4xl dark:text-white"
          >
            Tú eliges cómo traerlo
          </h2>
          <p className="mt-3 text-base text-ink-600 dark:text-ink-300">
            Todo se compra en Estados Unidos y llega a tu puerta en 8 a 12 días hábiles.
            La diferencia está en quién elige el producto: nosotros ya lo hicimos en el
            catálogo, o lo eliges tú y te lo cotizamos.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[
            { ...TIENDA, Icon: ShoppingBag, acento: false },
            { ...ENCARGO, Icon: Link2, acento: true },
          ].map(({ etiqueta, titulo, descripcion, bullets, cta, href, Icon, acento }) => (
            <article
              key={titulo}
              className="group flex flex-col rounded-3xl border border-ink-200 bg-white p-7 transition-shadow hover:shadow-lift sm:p-9 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    acento
                      ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-aduana-50 text-aduana-600 dark:bg-aduana-500/15 dark:text-aduana-400'
                      : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  }
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={acento ? 'sello' : 'sello sello-azul'}>{etiqueta}</span>
              </div>

              <h3 className="mt-5 font-heading text-2xl font-bold text-ink-900 text-balance dark:text-white">
                {titulo}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {descripcion}
              </p>

              <ul className="mt-6 flex flex-col gap-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-200">
                    <Check
                      className={
                        acento
                          ? 'mt-0.5 h-4 w-4 shrink-0 text-aduana-500'
                          : 'mt-0.5 h-4 w-4 shrink-0 text-brand-500'
                      }
                      aria-hidden="true"
                    />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <Link
                  href={href}
                  className={
                    acento
                      ? 'inline-flex items-center gap-2 rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100'
                      : 'inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600'
                  }
                >
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
