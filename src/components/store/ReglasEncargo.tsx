import { Smartphone, Ban, Scale, Receipt, Truck, Boxes } from 'lucide-react'
import {
  MAX_PESO_LB,
  MAX_DIMENSIONES_M,
  MAX_UNIDADES_IGUALES,
  TARIFA_LIBRA_USD,
  DIAS_ENTREGA,
  REGLAS_CELULARES,
  PROHIBIDOS,
} from '@/lib/encargos'

/**
 * Las condiciones del servicio de pedidos especiales, dichas antes de que el
 * cliente pague.
 *
 * Es información que la competencia (los casilleros) publica y que aquí faltaba
 * por completo. Decirla no espanta ventas: espanta reclamos y paquetes
 * retenidos en la DIAN.
 */

const LIMITES = [
  {
    Icon: Receipt,
    titulo: 'Precio con todo incluido',
    detalle: 'La cotización ya trae flete, aduana, impuestos y envío nacional. El día que te entregamos el paquete no pagas nada más.',
  },
  {
    Icon: Boxes,
    titulo: `Máximo ${MAX_UNIDADES_IGUALES} unidades iguales`,
    detalle: 'En un mismo envío no pueden ir más de seis unidades del mismo producto. Si necesitas más, lo partimos en varios envíos.',
  },
  {
    Icon: Scale,
    titulo: `Hasta ${MAX_PESO_LB} lb por orden`,
    detalle: `Unos 50 kilos, y máximo ${MAX_DIMENSIONES_M} metros sumando las tres dimensiones. Si tu pedido es más grande, escríbenos y lo organizamos.`,
  },
  {
    Icon: Truck,
    titulo: `Llega en ${DIAS_ENTREGA}`,
    detalle: `La tarifa es de US$ ${TARIFA_LIBRA_USD} por libra e incluye el envío nacional hasta tu puerta, en cualquier ciudad de Colombia.`,
  },
]

export function ReglasEncargo() {
  return (
    <>
      {/* ── Condiciones del servicio ─────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 dark:bg-ink-950" aria-labelledby="limites-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Condiciones</p>
            <h2
              id="limites-heading"
              className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.03em] text-ink-900 text-balance sm:text-4xl dark:text-white"
            >
              Lo que tienes que saber antes de pedir
            </h2>
            <p className="mt-3 text-base text-ink-600 dark:text-ink-300">
              Unas las pone la aduana colombiana y otras nuestra operación. Te las decimos
              antes de que pagues, para que no haya sorpresas cuando el paquete ya viene en camino.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LIMITES.map(({ Icon, titulo, detalle }) => (
              <div
                key={titulo}
                className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink-900 dark:text-white">
                  {titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {detalle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Celulares ────────────────────────────────────────────── */}
      <section className="bg-hueso py-16 sm:py-20" aria-labelledby="celulares-heading">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
          <div>
            <span className="sello">
              <Smartphone className="h-3 w-3" aria-hidden="true" />
              Trámite especial
            </span>
            <h2
              id="celulares-heading"
              className="mt-4 font-heading text-3xl font-extrabold tracking-[-0.03em] text-ink-900 text-balance sm:text-4xl dark:text-white"
            >
              Traer un celular tiene sus reglas
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Es el producto que más piden y el que más se queda retenido cuando se hace
              mal. Nosotros nos encargamos del trámite completo, pero conviene que sepas
              en qué consiste.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              Si lo que quieres es un iPhone o un Samsung que ya tenemos en el catálogo,
              es más simple: ahí el trámite ya está resuelto y el precio ya está calculado.
            </p>
          </div>

          <ol className="flex flex-col">
            {REGLAS_CELULARES.map(({ titulo, detalle }, i) => (
              <li
                key={titulo}
                className="flex gap-4 border-t border-ink-200 py-5 first:border-t-0 first:pt-0 dark:border-ink-800"
              >
                <span className="font-mono text-sm font-bold text-aduana-500" aria-hidden="true">
                  0{i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink-900 dark:text-white">{titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {detalle}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Prohibidos ───────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 dark:bg-ink-950" aria-labelledby="prohibidos-heading">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
          <div>
            <span className="sello">
              <Ban className="h-3 w-3" aria-hidden="true" />
              No podemos traerlo
            </span>
            <h2
              id="prohibidos-heading"
              className="mt-4 font-heading text-3xl font-extrabold tracking-[-0.03em] text-ink-900 text-balance sm:text-4xl dark:text-white"
            >
              Lo que no entra al país
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Hay mercancía restringida o prohibida por seguridad, salud pública o normas
              ambientales. Si tienes dudas con algo puntual, pregúntanos antes de comprarlo:
              es gratis y evita perder el pedido.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {PROHIBIDOS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
              >
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
