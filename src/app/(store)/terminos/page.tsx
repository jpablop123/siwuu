import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y Condiciones de uso de SiwuuShop',
  robots: 'index,follow',
}

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'SiwuuShop'
const ULTIMA_ACTUALIZACION = '1 de junio de 2026'

export default function TerminosPage() {
  return (
    <div className="bg-white dark:bg-zinc-950">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
            <strong className="font-semibold">Aviso:</strong> Este documento es un
            borrador inicial. Antes de operar comercialmente, validá su contenido con
            un asesor jurídico colombiano.
          </div>
        </header>

        <Section title="1. Aceptación de los términos">
          <p>
            Al acceder, registrarte o realizar una compra en {STORE_NAME} (en adelante
            &ldquo;la Tienda&rdquo;) aceptás expresamente estos Términos y Condiciones,
            así como la{' '}
            <Link href="/politica-privacidad" className="text-emerald-700 underline hover:no-underline dark:text-emerald-400">
              Política de Tratamiento de Datos
            </Link>
            . Si no estás de acuerdo, debés abstenerte de usar la plataforma.
          </p>
        </Section>

        <Section title="2. Definiciones">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Usuario:</strong> persona natural mayor de 18 años con capacidad
              legal para celebrar contratos en Colombia.
            </li>
            <li>
              <strong>Producto:</strong> bien ofrecido en la Tienda, sujeto a
              disponibilidad de inventario y al precio publicado al momento de la
              compra.
            </li>
            <li>
              <strong>Pedido:</strong> manifestación de voluntad del Usuario de
              adquirir uno o más productos, confirmada mediante el pago.
            </li>
          </ul>
        </Section>

        <Section title="3. Registro de cuenta">
          <p>
            El Usuario es responsable de la veracidad de la información suministrada
            al registrarse. {STORE_NAME} podrá suspender o cancelar cuentas con datos
            falsos, duplicados o usadas con fines fraudulentos. Las credenciales son
            personales e intransferibles.
          </p>
        </Section>

        <Section title="4. Precios, pagos y facturación">
          <p>
            Los precios están en pesos colombianos (COP), incluyen el IVA cuando aplica
            y pueden cambiar sin previo aviso, salvo para pedidos ya confirmados. Los
            pagos se procesan a través de Wompi como pasarela de pagos certificada.
            {STORE_NAME} no almacena información sensible de tarjetas de crédito.
          </p>
          <p>
            La factura electrónica se emitirá al correo registrado conforme a la
            normativa de la DIAN.
          </p>
        </Section>

        <Section title="5. Envíos">
          <p>
            Los pedidos se envían a la dirección registrada al hacer el pedido. Los
            tiempos de entrega son estimados y dependen de la transportadora. La
            Tienda no se hace responsable por demoras causadas por fuerza mayor,
            direcciones incorrectas suministradas por el Usuario, o eventos ajenos a
            su control.
          </p>
        </Section>

        <Section title="6. Derecho de retracto">
          <p>
            Conforme al Estatuto del Consumidor (Ley 1480 de 2011), el Usuario tiene
            derecho a retractarse dentro de los <strong>cinco (5) días hábiles</strong>{' '}
            siguientes a la entrega del producto, siempre que éste no haya sido usado
            y mantenga su empaque original. El costo de devolución corre por cuenta
            del Usuario salvo en caso de defecto del producto.
          </p>
        </Section>

        <Section title="7. Garantías">
          <p>
            Todos los productos cuentan con la garantía legal de tres (3) meses
            establecida por el Estatuto del Consumidor, sin perjuicio de las
            garantías adicionales ofrecidas por el fabricante. Para hacer efectiva la
            garantía, el Usuario debe contactarnos por los canales oficiales con su
            número de pedido.
          </p>
        </Section>

        <Section title="8. Propiedad intelectual">
          <p>
            Todos los contenidos de la Tienda (imágenes, textos, logos, código) son
            propiedad de {STORE_NAME} o de sus respectivos titulares. Está prohibida
            su reproducción sin autorización escrita.
          </p>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <p>
            {STORE_NAME} no será responsable por daños indirectos, lucro cesante o
            daño emergente derivados del uso de la plataforma, salvo en los casos
            expresamente previstos por la ley colombiana.
          </p>
        </Section>

        <Section title="10. Jurisdicción y ley aplicable">
          <p>
            Estos Términos se rigen por la ley colombiana. Cualquier controversia
            será resuelta por los jueces competentes de Colombia, sin perjuicio de
            los mecanismos alternativos de solución de conflictos disponibles ante
            la Superintendencia de Industria y Comercio (SIC).
          </p>
        </Section>

        <Section title="11. Modificaciones">
          <p>
            {STORE_NAME} se reserva el derecho de modificar estos Términos en
            cualquier momento. Los cambios se publicarán en esta misma página con la
            fecha de actualización. El uso continuado de la plataforma después de un
            cambio implica la aceptación de los nuevos términos.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>
            Para cualquier consulta relacionada con estos Términos, escribinos a{' '}
            <a
              href="mailto:legal@siwuu.com"
              className="text-emerald-700 underline hover:no-underline dark:text-emerald-400"
            >
              legal@siwuu.com
            </a>
            .
          </p>
        </Section>

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <Link href="/" className="text-emerald-700 hover:underline dark:text-emerald-400">
            ← Volver al inicio
          </Link>
        </footer>
      </article>
    </div>
  )
}

// ── Helper ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 scroll-mt-20">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-zinc-800 dark:text-zinc-300 [&>p>strong]:text-zinc-900 dark:[&>p>strong]:text-zinc-100 [&_li>strong]:text-zinc-900 dark:[&_li>strong]:text-zinc-100">
        {children}
      </div>
    </section>
  )
}
