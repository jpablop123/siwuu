import type { Metadata } from 'next'
import Link from 'next/link'
import { Plane, Camera, ShieldCheck, RotateCcw, Ban, MessageCircle } from 'lucide-react'
import { getTiendaConfig } from '@/lib/cache/cms'
import { waLink } from '@/lib/brand'
import { DIAS_ENTREGA } from '@/lib/encargos'
import { TrackingBar } from '@/components/store/TrackingBar'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Garantía, devoluciones y tiempos de entrega',
  description:
    'Cuánto se demora tu pedido, qué hacer si llega mal, cómo funciona la garantía y en qué casos puedes devolverlo. Las condiciones de Siwuu, escritas antes de que compres.',
  alternates: { canonical: '/garantia' },
}

/**
 * Política de entrega, garantía y devoluciones.
 *
 * Existe por una razón concreta: vender equipos de varios millones con dos
 * semanas de espera y sin condiciones publicadas es la receta para reclamos y
 * contracargos. Acá queda escrito antes de que el cliente pague.
 *
 * Aplica el Estatuto del Consumidor (Ley 1480 de 2011). Los plazos de
 * operación —las 48 horas para reportar, por ejemplo— los define Siwuu; los
 * derechos del consumidor no: esos son los que la ley obliga.
 */

const PASOS_RECLAMO = [
  {
    titulo: 'Escríbenos por WhatsApp',
    detalle: 'Con el número de pedido, fotos o video del problema y, si es posible, el empaque como llegó.',
  },
  {
    titulo: 'Te respondemos en 24 horas hábiles',
    detalle: 'Revisamos el caso contra el video de verificación que grabamos antes de despacharlo y te decimos qué sigue.',
  },
  {
    titulo: 'Definimos la solución contigo',
    detalle: 'Según lo que haya pasado: reposición, reparación por garantía del fabricante o devolución del dinero.',
  },
  {
    titulo: 'Te contamos quién asume cada costo',
    detalle: 'Antes de iniciar cualquier trámite te decimos por escrito qué costos hay y quién los cubre. Nada se define sobre la marcha.',
  },
]

const NO_CUBRE = [
  'Daños por golpes, caídas o contacto con líquidos después de recibido',
  'Uso distinto al indicado por el fabricante o reparaciones hechas por terceros',
  'Desgaste normal de baterías y accesorios',
  'Problemas de software, aplicaciones o servicios del fabricante',
  'Equipos comprados por encargo que el cliente pidió a pesar de haberle advertido que no están homologados en Colombia',
]

export default async function GarantiaPage() {
  const config = await getTiendaConfig()
  const whatsapp = config?.footer_whatsapp

  return (
    <>
      {/* ── Encabezado ─────────────────────────────────────────── */}
      <section className="escena relative overflow-hidden border-b border-ink-200 dark:border-ink-800">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="sello sello-azul">Condiciones</span>
          <h1 className="escena-ink mt-5 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl">
            Garantía, devoluciones y tiempos de entrega
          </h1>
          <p className="escena-muted mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
            Todo lo que compras con Siwuu se trae de Estados Unidos cuando haces el pedido.
            Eso cambia los tiempos y cambia qué pasa si algo sale mal. Preferimos que lo
            sepas antes de pagar y no después.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        {/* ── 1. Tiempos ───────────────────────────────────────── */}
        <section aria-labelledby="tiempos">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <Plane className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="tiempos" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
              Cuánto se demora tu pedido
            </h2>
          </div>

          <p className="mt-5 text-ink-700 dark:text-ink-200">
            <b className="font-semibold text-ink-900 dark:text-white">{DIAS_ENTREGA}</b> desde que
            confirmas el pago, tanto si compras del catálogo como si es un pedido especial. No
            tenemos bodega en Colombia: cada pedido se compra en Estados Unidos cuando tú lo haces,
            y por eso nada llega al día siguiente.
          </p>

          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
            <TrackingBar />
            <p className="mt-5 text-sm text-ink-600 dark:text-ink-300">
              Te avisamos en cada cambio de estado. Si tu pedido se pasa del plazo por algo
              nuestro o del transporte, te lo decimos apenas lo sepamos — no esperamos a que
              preguntes — y puedes pedir la devolución del dinero sin discusión.
            </p>
          </div>

          <p className="mt-5 text-sm text-ink-600 dark:text-ink-300">
            Los días hábiles no cuentan sábados, domingos ni festivos. Las revisiones de aduana
            son el paso menos predecible: la mayoría de los pedidos pasa sin novedad, pero cuando
            uno queda en revisión el plazo se puede correr.
          </p>
        </section>

        {/* ── 2. Al recibir ────────────────────────────────────── */}
        <section className="mt-14" aria-labelledby="recibir">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aduana-50 text-aduana-600 dark:bg-aduana-500/15 dark:text-aduana-400">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="recibir" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
              Si llega dañado o no es lo que pediste
            </h2>
          </div>

          <p className="mt-5 text-ink-700 dark:text-ink-200">
            Tienes <b className="font-semibold text-ink-900 dark:text-white">48 horas desde la entrega</b> para
            avisarnos, con fotos o video del producto y del empaque como te llegó. Con eso podemos
            reclamarle al transportador, que maneja plazos cortos: si se vence, se pierde el reclamo.
          </p>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Si el producto llegó golpeado en el transporte, incompleto o no corresponde a lo que
            pediste, lo resolvemos nosotros: reposición o devolución del dinero. En ese caso tú no
            pagas ningún costo de transporte.
          </p>

          <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-500/30 dark:bg-brand-500/10">
            <h3 className="font-heading text-base font-bold text-ink-900 dark:text-white">
              Grabamos tu pedido antes de despacharlo
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
              De cada pedido grabamos un video corto de la caja sellada, con el número de serie
              visible, el peso y el empaque con el que sale. Así los dos sabemos en qué estado se
              despachó. Si quieres que además lo encendamos y grabemos que funciona, pídelo antes
              de que compremos: implica abrir la caja, y por eso no lo hacemos por defecto ni lo
              hacemos con celulares.
            </p>
          </div>
        </section>

        {/* ── 3. Garantía ──────────────────────────────────────── */}
        <section className="mt-14" aria-labelledby="garantia">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="garantia" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
              Garantía
            </h2>
          </div>

          <p className="mt-5 text-ink-700 dark:text-ink-200">
            Todos los equipos que traemos son nuevos y sellados de fábrica, con la garantía del
            fabricante. Para las compras del catálogo aplica además la garantía legal que exige
            el Estatuto del Consumidor: <b className="font-semibold text-ink-900 dark:text-white">un
            año para productos nuevos</b>, salvo que el fabricante ofrezca un plazo mayor.
          </p>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Si el equipo falla por un defecto de fábrica dentro de ese plazo, escríbenos:
            gestionamos el trámite con el fabricante o con su servicio técnico autorizado en
            Colombia cuando existe, y te acompañamos durante todo el proceso.
          </p>

          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
            <h3 className="font-heading text-base font-bold text-ink-900 dark:text-white">
              Los costos del trámite
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
              La mayoría de las marcas que traemos tienen servicio técnico autorizado en
              Colombia, así que el trámite se hace acá y no tiene costo de transporte
              internacional. Cuando el equipo sí tiene que salir del país, te decimos{' '}
              <b>por escrito y antes de empezar</b> qué costos tiene el trámite y cuáles asume
              cada parte. Nunca vas a tener que decidir con el equipo ya enviado y sin saber
              qué vas a pagar.
            </p>
          </div>
        </section>

        {/* ── 4. Retracto ──────────────────────────────────────── */}
        <section className="mt-14" aria-labelledby="retracto">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="retracto" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
              Si te arrepentiste
            </h2>
          </div>

          <p className="mt-5 text-ink-700 dark:text-ink-200">
            Como compras por internet, la ley te da{' '}
            <b className="font-semibold text-ink-900 dark:text-white">cinco días hábiles desde que
            recibes el producto</b> para retractarte, sin tener que explicar por qué. El producto
            debe volver sin usar, completo y en su empaque original. Los costos de devolverlo los
            asume quien se retracta, y te reintegramos el dinero dentro de los treinta días
            calendario siguientes.
          </p>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Si tu pedido todavía no se ha comprado en Estados Unidos, la cancelación es más simple:
            escríbenos y te devolvemos el dinero completo. Una vez el producto ya está comprado
            allá, entra el retracto normal.
          </p>
        </section>

        {/* ── 5. Qué no cubre ──────────────────────────────────── */}
        <section className="mt-14" aria-labelledby="no-cubre">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <Ban className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="no-cubre" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
              Qué no cubre la garantía
            </h2>
          </div>

          <ul className="mt-5 grid gap-3">
            {NO_CUBRE.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
              >
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── 6. Pedidos especiales ────────────────────────────── */}
        <section className="mt-14" aria-labelledby="encargos">
          <h2 id="encargos" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
            En los pedidos especiales
          </h2>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Cuando te traemos algo por{' '}
            <Link href="/pedido-usa" className="link-brand font-semibold">encargo</Link>, compramos
            en la tienda de Estados Unidos que tú elegiste. La garantía del producto es la que dé
            esa tienda o el fabricante, y nosotros hacemos el trámite por ti: te pasamos el soporte
            de la compra y gestionamos el reclamo.
          </p>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Antes de comprar te avisamos si el producto tiene alguna restricción para entrar al
            país o si no está homologado en Colombia. Si aun así decides pedirlo, esa parte corre
            por tu cuenta.
          </p>
          <p className="mt-4 text-ink-700 dark:text-ink-200">
            Como la compra se hace a tu nombre y en la tienda que tú escogiste, si el producto
            tiene que volver a Estados Unidos por garantía o por cambio, el costo de ese envío
            corre por tu cuenta. Te decimos cuánto es antes de mandarlo y nosotros nos encargamos
            de todo el trámite.
          </p>
        </section>

        {/* ── 7. Cómo reclamar ─────────────────────────────────── */}
        <section className="mt-14" aria-labelledby="reclamar">
          <h2 id="reclamar" className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
            Cómo hacer un reclamo
          </h2>

          <ol className="mt-6 flex flex-col">
            {PASOS_RECLAMO.map(({ titulo, detalle }, i) => (
              <li
                key={titulo}
                className="flex gap-4 border-t border-ink-200 py-5 first:border-t-0 first:pt-0 dark:border-ink-800"
              >
                <span className="font-mono text-sm font-bold text-brand-500" aria-hidden="true">
                  0{i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink-900 dark:text-white">{titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{detalle}</p>
                </div>
              </li>
            ))}
          </ol>

          <a
            href={waLink(whatsapp, 'Hola Siwuu, tengo un reclamo sobre mi pedido. Mi número de pedido es:')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Abrir un reclamo por WhatsApp
          </a>
        </section>

        <p className="mt-14 border-t border-ink-200 pt-6 text-xs leading-relaxed text-ink-500 dark:border-ink-800 dark:text-ink-400">
          Estas condiciones se suman a los derechos que te da el Estatuto del Consumidor
          (Ley 1480 de 2011) y no los reemplazan ni los limitan. Ante cualquier diferencia entre
          este texto y la ley, manda la ley. Última actualización: septiembre de 2026.
        </p>
      </div>
    </>
  )
}
