'use client'

import { useState, useTransition, useEffect } from 'react'
import { actualizarEstadoPedido } from '@/lib/actions/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ExternalLink, Check, AlertTriangle, Truck, Package, PartyPopper, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Pipeline de negocio ────────────────────────────────────────────────────────

const PIPELINE = [
  {
    key: 'pago_confirmado',
    label: 'Recibido',
    desc: 'Pago verificado',
    Icon: CreditCard,
  },
  {
    key: 'procesando',
    label: 'En Bodega',
    desc: 'Preparando pedido',
    Icon: Package,
  },
  {
    key: 'en_camino',
    label: 'Despachado',
    desc: 'En tránsito',
    Icon: Truck,
  },
  {
    key: 'entregado',
    label: 'Entregado',
    desc: 'Recibido por cliente',
    Icon: PartyPopper,
  },
] as const

type PipelineEstado = (typeof PIPELINE)[number]['key']

const PIPELINE_KEYS = PIPELINE.map((p) => p.key) as readonly string[]

// ── Props ─────────────────────────────────────────────────────────────────────

interface OrderStatusManagerProps {
  pedidoId: string
  estadoActual: string
  numeroGuiaActual?: string
  itemsConProveedor: Array<{
    nombre: string
    cantidad: number
    urlProveedor?: string | null
  }>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderStatusManager({
  pedidoId,
  estadoActual,
  numeroGuiaActual,
  itemsConProveedor,
}: OrderStatusManagerProps) {
  const currentIndex = PIPELINE_KEYS.indexOf(estadoActual)
  const isInPipeline = currentIndex !== -1

  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [numeroGuia, setNumeroGuia] = useState(numeroGuiaActual ?? '')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  // Reset target when current state changes (after save)
  useEffect(() => {
    setTargetIndex(null)
  }, [estadoActual])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.tipo === 'exito' ? 3000 : 4000)
    return () => clearTimeout(t)
  }, [toast])

  const targetEstado = targetIndex !== null ? (PIPELINE_KEYS[targetIndex] as PipelineEstado) : null
  const needsGuia = targetEstado === 'en_camino'
  const canSave = targetIndex !== null && targetIndex !== currentIndex && (!needsGuia || numeroGuia.trim().length > 0)

  const handleStepClick = (index: number) => {
    if (index === currentIndex) {
      setTargetIndex(null)
    } else {
      setTargetIndex(index)
    }
  }

  const handleGuardar = () => {
    if (!targetEstado || !canSave) return
    startTransition(async () => {
      const result = await actualizarEstadoPedido(
        pedidoId,
        targetEstado,
        needsGuia ? numeroGuia.trim() : undefined,
      )
      if (result.ok) {
        setToast({ mensaje: 'Estado actualizado correctamente', tipo: 'exito' })
        setTargetIndex(null)
      } else {
        setToast({ mensaje: result.error || 'Error al actualizar', tipo: 'error' })
      }
    })
  }

  // ── States outside pipeline ────────────────────────────────────────────────

  if (estadoActual === 'cancelado') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Pedido cancelado</p>
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-500">
          Este pedido fue cancelado y no puede avanzar en el pipeline.
        </p>
      </div>
    )
  }

  if (estadoActual === 'pendiente') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Esperando pago</p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          El cliente aún no ha completado el pago. El estado avanzará automáticamente al recibir la confirmación de Wompi.
        </p>
      </div>
    )
  }

  if (estadoActual === 'enviado_proveedor') {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Enviado al proveedor</p>
        <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-500">
          Estado interno de proveedor. Cuando tengas el producto en bodega, avanza a &ldquo;Procesando&rdquo;.
        </p>
      </div>
    )
  }

  // ── Stepper (pipeline states) ──────────────────────────────────────────────

  const mostrarPanelProveedor =
    estadoActual === 'pago_confirmado' || estadoActual === 'procesando'

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Pipeline del pedido
        </h3>

        <ol className="relative space-y-0">
          {PIPELINE.map((step, index) => {
            const isDone = isInPipeline && index < currentIndex
            const isCurrent = index === currentIndex
            const isTarget = index === targetIndex
            const isClickable = !isCurrent

            return (
              <li key={step.key} className="flex gap-3">
                {/* Line + circle column */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!isClickable || isPending}
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/20 dark:bg-zinc-900'
                          : isTarget
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'cursor-pointer border-zinc-300 bg-white text-zinc-400 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800',
                    )}
                    aria-label={`Cambiar a ${step.label}`}
                    aria-pressed={isTarget}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <step.Icon
                        className={cn(
                          'h-3.5 w-3.5',
                          isCurrent
                            ? 'text-emerald-500'
                            : isTarget
                              ? 'text-white'
                              : 'text-zinc-400',
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {/* Connector line */}
                  {index < PIPELINE.length - 1 && (
                    <div
                      className={cn(
                        'mt-0.5 w-0.5 flex-1',
                        isDone ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
                      )}
                      style={{ minHeight: '2rem' }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Label column */}
                <div className="pb-6">
                  <p
                    className={cn(
                      'text-sm font-medium leading-8',
                      isCurrent
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isTarget
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isDone
                            ? 'text-zinc-700 dark:text-zinc-300'
                            : 'text-zinc-400 dark:text-zinc-500',
                    )}
                  >
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        actual
                      </span>
                    )}
                    {isTarget && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        seleccionado
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{step.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {/* Guía input — appears when en_camino is the target */}
        {needsGuia && (
          <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
            <p className="mb-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              Número de guía requerido para despachar
            </p>
            <Input
              label="Número de guía de la transportadora"
              value={numeroGuia}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroGuia(e.target.value)}
              placeholder="Ej: 9000123456789"
              autoFocus
            />
            {!numeroGuia.trim() && (
              <p className="mt-1.5 text-xs text-rose-500">
                Debes ingresar el número de guía antes de despachar.
              </p>
            )}
          </div>
        )}

        {/* Save button */}
        {targetIndex !== null && targetIndex !== currentIndex && (
          <Button
            onClick={handleGuardar}
            loading={isPending}
            disabled={!canSave}
            className="mt-4 w-full"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Guardando...' : `Confirmar: ${PIPELINE[targetIndex].label}`}
          </Button>
        )}
      </div>

      {/* Panel compra al proveedor */}
      {mostrarPanelProveedor && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-amber-800">
              Pendiente de comprar al proveedor
            </h3>
          </div>
          <p className="mb-3 text-xs text-amber-700">
            Compra estos items antes de cambiar el estado a &ldquo;En Bodega&rdquo;
          </p>
          <ul className="space-y-2">
            {itemsConProveedor.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-800">
                  {item.cantidad} x {item.nombre}
                </span>
                {item.urlProveedor ? (
                  <a
                    href={item.urlProveedor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 underline hover:text-indigo-800"
                  >
                    Ir al proveedor
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-xs text-zinc-500">Sin link</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all',
            toast.tipo === 'exito' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
          )}
          role="alert"
        >
          {toast.tipo === 'exito' && <Check className="h-4 w-4" aria-hidden="true" />}
          {toast.mensaje}
        </div>
      )}
    </div>
  )
}
