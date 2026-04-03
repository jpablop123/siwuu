'use client'

import { useState, useTransition, useEffect } from 'react'
import { actualizarEstadoPedido } from '@/lib/actions/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ExternalLink, Save, Check, AlertTriangle } from 'lucide-react'

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente de pago',
  pago_confirmado: 'Pago confirmado',
  procesando: 'Procesando',
  enviado_proveedor: 'Enviado al proveedor',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const ESTADO_EMOJIS: Record<string, string> = {
  pendiente: '\u23f3',
  pago_confirmado: '\u2705',
  procesando: '\ud83d\udd04',
  enviado_proveedor: '\ud83d\udce6',
  en_camino: '\ud83d\ude9a',
  entregado: '\ud83c\udf89',
  cancelado: '\u274c',
}

interface AdminOrderControlProps {
  pedidoId: string
  estadoActual: string
  numeroGuiaActual?: string
  itemsConProveedor: Array<{
    nombre: string
    cantidad: number
    urlProveedor?: string | null
  }>
}

export function AdminOrderControl({
  pedidoId,
  estadoActual,
  numeroGuiaActual,
  itemsConProveedor,
}: AdminOrderControlProps) {
  const [selectedEstado, setSelectedEstado] = useState(estadoActual)
  const [numeroGuia, setNumeroGuia] = useState(numeroGuiaActual ?? '')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), toast.tipo === 'exito' ? 3000 : 4000)
    return () => clearTimeout(timeout)
  }, [toast])

  const handleGuardar = () => {
    startTransition(async () => {
      const result = await actualizarEstadoPedido(
        pedidoId,
        selectedEstado,
        numeroGuia || undefined
      )
      if (result.ok) {
        setToast({ mensaje: 'Estado actualizado correctamente', tipo: 'exito' })
      } else {
        setToast({ mensaje: result.error || 'Error al actualizar', tipo: 'error' })
      }
    })
  }

  const mostrarPanelProveedor =
    estadoActual === 'pago_confirmado' || estadoActual === 'procesando'

  return (
    <div className="space-y-4">
      {/* Cambio de estado */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cambiar estado</h3>
        <label htmlFor="estado-select" className="sr-only">
          Estado del pedido
        </label>
        <select
          id="estado-select"
          value={selectedEstado}
          onChange={(e) => setSelectedEstado(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {Object.entries(ESTADO_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {ESTADO_EMOJIS[key]} {label}
            </option>
          ))}
        </select>
      </div>

      {/* Número de guía */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <Input
          label="Número de guía de envío"
          value={numeroGuia}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroGuia(e.target.value)}
          placeholder="Ej: 9000123456789"
        />
        {numeroGuiaActual && (
          <p className="mt-1 text-xs text-zinc-500">
            Guía actual: <span className="font-mono">{numeroGuiaActual}</span>
          </p>
        )}
      </div>

      {/* Botón guardar */}
      <Button onClick={handleGuardar} loading={isPending} className="w-full">
        <Save className="h-4 w-4" aria-hidden="true" />
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>

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
            Compra estos items antes de cambiar el estado
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
                  <span className="text-xs text-zinc-500">Sin link de proveedor</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.tipo === 'exito'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
          role="alert"
        >
          {toast.tipo === 'exito' && <Check className="h-4 w-4" aria-hidden="true" />}
          {toast.mensaje}
        </div>
      )}
    </div>
  )
}
