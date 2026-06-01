import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Tratamiento de Datos Personales',
  description:
    'Política de Tratamiento de Datos Personales de SiwuuShop, conforme a la Ley 1581 de 2012.',
  robots: 'index,follow',
}

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'SiwuuShop'
const ULTIMA_ACTUALIZACION = '1 de junio de 2026'

export default function PoliticaPrivacidadPage() {
  return (
    <div className="bg-white dark:bg-zinc-950">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Política de Tratamiento de Datos Personales
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Última actualización: {ULTIMA_ACTUALIZACION} · Ley 1581 de 2012 y Decreto
            1377 de 2013
          </p>
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
            <strong className="font-semibold">Aviso:</strong> Este documento es un
            borrador inicial. Antes de operar comercialmente, validá su contenido con
            un asesor jurídico y registrá las bases de datos ante la SIC si superás
            los umbrales del{' '}
            <abbr title="Registro Nacional de Bases de Datos">RNBD</abbr>.
          </div>
        </header>

        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>{STORE_NAME}</strong> es el responsable del tratamiento de los
            datos personales recolectados a través de esta plataforma. Para cualquier
            solicitud relacionada con tus datos, podés contactarnos en{' '}
            <a
              href="mailto:privacidad@siwuu.com"
              className="text-emerald-700 underline hover:no-underline dark:text-emerald-400"
            >
              privacidad@siwuu.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Identificación:</strong> nombre, documento de identidad (cuando
              aplica), fecha de creación de cuenta.
            </li>
            <li>
              <strong>Contacto:</strong> correo electrónico y número de teléfono móvil.
            </li>
            <li>
              <strong>Dirección de envío:</strong> ciudad, departamento, dirección
              física, barrio e indicaciones de entrega.
            </li>
            <li>
              <strong>Datos transaccionales:</strong> historial de pedidos, montos y
              estados de pago. <em>No almacenamos datos sensibles de tarjetas de
              crédito</em> — éstos los procesa directamente Wompi.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP al momento del
              consentimiento (evidencia legal), cookies de sesión, información del
              navegador necesaria para prevenir fraude.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalidades del tratamiento">
          <p>Usamos tus datos para:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Crear y administrar tu cuenta de usuario.</li>
            <li>Procesar tus pedidos, pagos, envíos y devoluciones.</li>
            <li>Enviarte notificaciones transaccionales (confirmación, despacho).</li>
            <li>
              Enviarte comunicaciones comerciales y promocionales, únicamente si
              expresamente lo autorizás.
            </li>
            <li>
              Cumplir obligaciones legales (facturación electrónica DIAN, prevención
              de fraude, requerimientos de autoridades).
            </li>
            <li>Mejorar nuestros productos y servicios.</li>
          </ul>
        </Section>

        <Section title="4. Tus derechos como titular">
          <p>
            Conforme al artículo 8 de la Ley 1581 de 2012, tenés derecho a:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Conocer</strong> qué datos tuyos tenemos almacenados y para qué
              los usamos.
            </li>
            <li>
              <strong>Actualizar o rectificar</strong> datos parciales, inexactos,
              incompletos o desactualizados.
            </li>
            <li>
              <strong>Revocar la autorización</strong> y solicitar la supresión de tus
              datos cuando no exista una obligación legal o contractual que requiera
              conservarlos.
            </li>
            <li>
              <strong>Solicitar prueba</strong> de la autorización que nos diste.
            </li>
            <li>
              <strong>Presentar quejas</strong> ante la Superintendencia de Industria
              y Comercio (SIC).
            </li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <a
              href="mailto:privacidad@siwuu.com"
              className="text-emerald-700 underline hover:no-underline dark:text-emerald-400"
            >
              privacidad@siwuu.com
            </a>{' '}
            indicando tu nombre completo, el derecho que querés ejercer y los datos
            relacionados con la solicitud. Tenemos hasta 15 días hábiles para
            responder.
          </p>
        </Section>

        <Section title="5. Compartir datos con terceros">
          <p>
            Compartimos tus datos únicamente con los siguientes encargados, bajo
            acuerdos de confidencialidad y solo en la medida necesaria para prestar el
            servicio:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Wompi</strong> — procesamiento de pagos.
            </li>
            <li>
              <strong>Supabase</strong> — infraestructura de base de datos y
              autenticación.
            </li>
            <li>
              <strong>Resend</strong> — envío de correos transaccionales.
            </li>
            <li>
              <strong>Transportadoras</strong> — entrega física de los productos.
            </li>
            <li>
              <strong>Autoridades</strong> — cuando sea requerido por ley.
            </li>
          </ul>
          <p>
            No vendemos, alquilamos ni compartimos datos personales con terceros para
            fines de marketing externo.
          </p>
        </Section>

        <Section title="6. Seguridad de la información">
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus
            datos: cifrado en tránsito (HTTPS/TLS), control de acceso por roles,
            registros de auditoría, hashing seguro de contraseñas y aislamiento de
            datos sensibles de pago en pasarelas certificadas.
          </p>
        </Section>

        <Section title="7. Retención">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa o durante el plazo
            necesario para cumplir las finalidades descritas y las obligaciones
            legales aplicables (en particular, las contables y tributarias, que pueden
            llegar hasta diez años).
          </p>
        </Section>

        <Section title="8. Menores de edad">
          <p>
            La plataforma está dirigida a mayores de 18 años. No recolectamos
            conscientemente datos de menores. Si detectamos una cuenta de un menor,
            procederemos a suprimirla.
          </p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>
            Podemos actualizar esta política para reflejar cambios legales o
            operativos. Los cambios sustanciales serán comunicados al correo
            registrado. La versión vigente siempre está disponible en esta página
            con la fecha de última actualización.
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
