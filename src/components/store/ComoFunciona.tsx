import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Cómo funciona, en dos columnas: comprar del catálogo y encargar desde USA.
 *
 * Los pasos van numerados porque acá el orden sí es información: es la
 * secuencia real del proceso, no una decoración.
 */

const PASOS_TIENDA = [
  { paso: 'Eliges tu equipo', detalle: 'Agregas al carrito el iPhone, Mac o accesorio del catálogo.' },
  { paso: 'Pagas en pesos', detalle: 'Con Nequi, PSE, Bancolombia o tarjeta, a través de Wompi.' },
  { paso: 'Lo compramos y te lo traemos', detalle: 'Lo compramos en Estados Unidos y llega a tu puerta en 8 a 12 días hábiles.' },
]

const PASOS_ENCARGO = [
  { paso: 'Nos mandas el link', detalle: 'Copias la URL del producto en la tienda gringa que sea.' },
  { paso: 'Te cotizamos en pesos', detalle: 'Precio final con envío e impuestos incluidos, antes de pagar.' },
  { paso: 'Lo compramos y te lo traemos', detalle: 'Mismos 8 a 12 días hábiles, y te avisamos en cada cambio de estado.' },
]

function Columna({
  etiqueta,
  titulo,
  pasos,
  href,
  cta,
  acento,
}: {
  etiqueta: string
  titulo: string
  pasos: { paso: string; detalle: string }[]
  href: string
  cta: string
  acento: boolean
}) {
  return (
    <div>
      <span className={acento ? 'sello' : 'sello sello-azul'}>{etiqueta}</span>
      <h3 className="escena-ink mt-4 font-heading text-2xl font-extrabold">{titulo}</h3>

      <ol className="mt-6 flex flex-col">
        {pasos.map(({ paso, detalle }, i) => (
          <li key={paso} className="escena-line flex gap-4 border-t py-5 first:border-t-0 first:pt-0">
            <span
              className={
                acento
                  ? 'font-mono text-sm font-bold text-aduana-500'
                  : 'font-mono text-sm font-bold text-brand-500'
              }
              aria-hidden="true"
            >
              0{i + 1}
            </span>
            <div className="min-w-0">
              <p className="escena-ink font-bold">{paso}</p>
              <p className="escena-muted mt-1 text-sm leading-relaxed">{detalle}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href={href}
        className="group mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="escena brasa relative overflow-hidden py-20 sm:py-24" aria-labelledby="como-heading">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Cómo funciona</p>
          <h2
            id="como-heading"
            className="escena-ink mt-3 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl"
          >
            Tú pagas y recibes. Del resto nos encargamos nosotros.
          </h2>
          <p className="escena-muted mt-4 text-base sm:text-lg">
            Sin casillero que abrir, sin formularios de aduana, sin tarjeta internacional.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Columna
            etiqueta="Desde el catálogo"
            titulo="Compras en nuestra tienda"
            pasos={PASOS_TIENDA}
            href="/productos"
            cta="Ver catálogo"
            acento={false}
          />
          <Columna
            etiqueta="Por encargo"
            titulo="Nos pides algo de USA"
            pasos={PASOS_ENCARGO}
            href="/pedido-usa"
            cta="Cotizar mi encargo"
            acento
          />
        </div>
      </div>
    </section>
  )
}
