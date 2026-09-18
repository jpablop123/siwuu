'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calculator, MessageCircle, Info, AlertTriangle, Smartphone } from 'lucide-react'
import { useCurrency } from '@/lib/currency/store'
import { waLink } from '@/lib/brand'
import {
  CATEGORIAS_ENCARGO,
  MAX_PESO_LB,
  TARIFA_LIBRA_USD,
  cotizar,
} from '@/lib/encargos'

const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface Props {
  whatsapp?: string | null
}

/**
 * Cotizador de encargos.
 *
 * El cliente ve un solo precio final: la tarifa por libra del courier ya trae
 * aduana e impuestos, así que no paga nada al recibir. Aplica además el trámite
 * especial de los celulares y el límite de peso por orden — vale más avisarlo
 * acá que explicarlo cuando el paquete ya está retenido.
 */
export function CotizadorForm({ whatsapp }: Props) {
  const rate = useCurrency((s) => s.rate)
  const fetchRate = useCurrency((s) => s.fetchRate)

  useEffect(() => {
    fetchRate()
  }, [fetchRate])

  const [link, setLink] = useState('')
  const [valor, setValor] = useState('')
  const [peso, setPeso] = useState('')
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS_ENCARGO[0].id)
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [tocado, setTocado] = useState(false)

  const categoria = CATEGORIAS_ENCARGO.find((c) => c.id === categoriaId) ?? CATEGORIAS_ENCARGO[0]
  const esCelular = Boolean(categoria.tramiteEspecial)

  const valorUsd = Number(valor) || 0
  const pesoLb = Math.max(Number(peso) || 0, 0)
  const excedePeso = pesoLb > MAX_PESO_LB

  const cotizacion = useMemo(
    () => cotizar({ valorUsd, pesoLb, trm: rate }),
    [valorUsd, pesoLb, rate],
  )

  const mensaje = useMemo(() => {
    const lineas = [
      'Hola Siwuu 👋 quiero cotizar un pedido especial desde Estados Unidos:',
      '',
      link ? `Producto: ${link}` : 'Producto: (les paso el link por acá)',
      `Categoría: ${categoria.nombre}`,
      valorUsd > 0 ? `Precio en USA: US$ ${valorUsd.toFixed(2)}` : '',
      pesoLb > 0 ? `Peso aproximado: ${pesoLb} lb` : '',
      ciudad ? `Ciudad de entrega: ${ciudad}` : '',
      nombre ? `Mi nombre: ${nombre}` : '',
      cotizacion ? `Estimado de la calculadora: ${copFmt.format(cotizacion.totalCop)}` : '',
    ]
    return lineas.filter(Boolean).join('\n')
  }, [link, categoria, valorUsd, pesoLb, ciudad, nombre, cotizacion])

  const faltaValor = tocado && valorUsd <= 0
  const inputClass =
    'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-ink-700 dark:bg-ink-900 dark:text-white'

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
      {/* ── Formulario ─────────────────────────────────────────── */}
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          setTocado(true)
          if (valorUsd > 0) {
            window.open(waLink(whatsapp, mensaje), '_blank', 'noopener,noreferrer')
          }
        }}
      >
        <div>
          <label htmlFor="pu-link" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
            Link del producto
          </label>
          <input
            id="pu-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.amazon.com/..."
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            Amazon, Best Buy, Walmart, Nike, eBay… cualquier tienda de Estados Unidos.
          </p>
        </div>

        <div>
          <label htmlFor="pu-cat" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
            ¿Qué es?
          </label>
          <select
            id="pu-cat"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className={inputClass}
          >
            {CATEGORIAS_ENCARGO.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {categoria.aviso && (
            <p className="mt-2 flex gap-2 rounded-xl border border-aduana-200 bg-aduana-50 p-3 text-xs leading-relaxed text-aduana-800 dark:border-aduana-500/30 dark:bg-aduana-500/10 dark:text-aduana-200">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {categoria.aviso}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pu-valor" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
              Precio en USA (USD)
            </label>
            <input
              id="pu-valor"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onBlur={() => setTocado(true)}
              placeholder="199.99"
              aria-invalid={faltaValor}
              aria-describedby={faltaValor ? 'pu-valor-error' : undefined}
              className={inputClass}
            />
            {faltaValor && (
              <p id="pu-valor-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Escribe cuánto cuesta el producto en la tienda gringa para poder calcular.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pu-peso" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
              Peso aproximado (libras)
            </label>
            <input
              id="pu-peso"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="2"
              aria-invalid={excedePeso}
              className={inputClass}
            />
            {excedePeso ? (
              <p className="mt-1.5 flex gap-1.5 text-xs text-aduana-700 dark:text-aduana-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Por encima de {MAX_PESO_LB} lb toca partir el pedido en varios envíos. Escríbenos y lo organizamos.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                Si no lo sabes, déjalo vacío: cobramos mínimo una libra.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pu-ciudad" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
              Ciudad de entrega
            </label>
            <input
              id="pu-ciudad"
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Bogotá"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pu-nombre" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-white">
              Tu nombre
            </label>
            <input
              id="pu-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Como quieres que te llamemos"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          className="halo-azul inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Enviar mi pedido por WhatsApp
        </button>
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Te confirmamos el precio exacto antes de que pagues nada.
        </p>
      </form>

      {/* ── Resultado ──────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center gap-2 border-b border-dashed border-ink-200 px-6 py-4 dark:border-ink-700">
            <Calculator className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-500 dark:text-ink-400">
              Estimado puesto en tu casa
            </p>
          </div>

          <div className="px-6 py-6">
            {cotizacion ? (
              <>
                <p className="font-heading text-4xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
                  {copFmt.format(cotizacion.totalCop)}
                </p>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  US$ {cotizacion.totalUsd.toFixed(2)} · TRM {copFmt.format(rate)}
                </p>

                <dl className="mt-6 flex flex-col gap-3 border-t border-ink-200 pt-5 text-sm dark:border-ink-800">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-600 dark:text-ink-300">Producto</dt>
                    <dd className="font-medium tabular-nums text-ink-900 dark:text-white">US$ {valorUsd.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-600 dark:text-ink-300">
                      Traerlo desde Miami ({cotizacion.librasCobradas} lb)
                    </dt>
                    <dd className="font-medium tabular-nums text-ink-900 dark:text-white">US$ {cotizacion.envio.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-600 dark:text-ink-300">Servicio Siwuu</dt>
                    <dd className="font-medium tabular-nums text-ink-900 dark:text-white">US$ {cotizacion.servicio.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-600 dark:text-ink-300">Aduana e impuestos</dt>
                    <dd className="font-medium text-brand-600 dark:text-brand-400">Ya incluidos</dd>
                  </div>
                </dl>

                <p className="mt-5 border-t border-ink-200 pt-4 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">
                  Incluye el envío nacional hasta tu puerta, en cualquier ciudad de Colombia.
                  Cuando recibas el paquete no pagas nada más.
                </p>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="font-heading text-2xl font-bold text-ink-400 dark:text-ink-600">
                  Escribe el precio
                </p>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                  Con el precio en dólares y el peso te mostramos cuánto cuesta puesto en tu casa.
                  La libra cuesta US$ {TARIFA_LIBRA_USD}.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 border-t border-ink-200 bg-hueso px-6 py-4 dark:border-ink-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-aduana-500" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              {esCelular
                ? 'Los celulares viajan solos en su propia guía y su trámite cuesta más, así que el estimado puede moverse. Te confirmamos el precio final antes de que pagues.'
                : 'Es un estimado con todo incluido: producto, flete, aduana, impuestos y envío hasta tu puerta. Te confirmamos el precio final antes de que pagues.'}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
