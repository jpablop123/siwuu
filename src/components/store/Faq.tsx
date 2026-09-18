'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Preguntas frecuentes.
 *
 * Responden a las objeciones reales de alguien que va a transferir varios
 * millones de pesos: tiempos, impuestos, medios de pago y cobertura.
 */

export interface FaqItem {
  pregunta: string
  respuesta: string
}

const DEFAULTS: FaqItem[] = [
  {
    pregunta: '¿Cuánto se demora en llegar mi pedido?',
    respuesta:
      'Entre 8 y 12 días hábiles desde que confirmas el pago, tanto si compras del catálogo como si es un encargo. Todo se compra en Estados Unidos cuando haces el pedido: no revendemos equipos que hayan estado guardados en una bodega en Colombia.',
  },
  {
    pregunta: '¿Tengo que pagar impuestos cuando llegue?',
    respuesta:
      'No. En Colombia las compras del exterior por encima de 200 dólares pagan IVA del 19% y arancel del 10%. Ese cálculo ya viene dentro del precio que ves en la tienda y dentro de la cotización de tu encargo: cuando el paquete llega no pagas un peso más.',
  },
  {
    pregunta: '¿Cómo sé que los equipos son originales?',
    respuesta:
      'Compramos en tiendas oficiales y grandes retailers de Estados Unidos. Todo llega nuevo, sellado de fábrica y con su garantía. De cada pedido grabamos un video de la caja sellada antes de despacharlo, con el número de serie visible.',
  },
  {
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta:
      'Pagas en pesos colombianos a través de Wompi: Nequi, PSE, botón Bancolombia y tarjetas de crédito o débito. No necesitas tarjeta internacional ni cuenta en dólares.',
  },
  {
    pregunta: '¿Hacen envíos a toda Colombia?',
    respuesta:
      'Sí, a cualquier ciudad o municipio del país, con transportadora nacional y número de guía. Te avisamos en cada cambio de estado hasta que timbramos en tu puerta.',
  },
  {
    pregunta: '¿Puedo pedir algo que no está en el catálogo?',
    respuesta:
      'Para eso es el encargo: nos pasas el link del producto en Amazon, Best Buy, Nike o la tienda que sea, y te cotizamos el precio final puesto en tu casa antes de que pagues nada.',
  },
]

export function Faq({
  items = DEFAULTS,
  titulo = 'Lo que todo el mundo pregunta antes de comprar',
  intro = '¿Te queda alguna duda? Escríbenos por WhatsApp y te respondemos desde Colombia.',
}: {
  items?: FaqItem[]
  titulo?: string
  intro?: string
}) {
  const [abierta, setAbierta] = useState<number | null>(0)

  return (
    <section className="bg-hueso py-16 sm:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
        <div>
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2
            id="faq-heading"
            className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.03em] text-ink-900 text-balance sm:text-4xl dark:text-white"
          >
            {titulo}
          </h2>
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
            {intro}
          </p>
        </div>

        <div className="divide-y divide-ink-200 border-y border-ink-200 dark:divide-ink-800 dark:border-ink-800">
          {items.map((item, i) => {
            const open = abierta === i
            return (
              <div key={item.pregunta}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setAbierta(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-boton-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span className="font-heading text-base font-semibold text-ink-900 sm:text-lg dark:text-white">
                      {item.pregunta}
                    </span>
                    <Plus
                      className={cn(
                        'h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200',
                        open && 'rotate-45',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-boton-${i}`}
                  hidden={!open}
                  className="pb-6 pr-10 text-sm leading-relaxed text-ink-600 dark:text-ink-300"
                >
                  {item.respuesta}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
