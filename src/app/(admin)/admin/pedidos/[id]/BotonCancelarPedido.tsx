'use client'

import { useTransition, useState } from 'react'
import { cancelarPedidoAction } from '@/lib/actions/admin'
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react'

const ESTADOS_NO_CANCELABLES = ['entregado', 'cancelado']

interface Props {
  pedidoId: string
  estadoActual: string
}

export function BotonCancelarPedido({ pedidoId, estadoActual }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (ESTADOS_NO_CANCELABLES.includes(estadoActual)) return null

  function handleClick() {
    setError(null)
    setConfirmando(true)
  }

  function handleCancelar() {
    setConfirmando(false)
  }

  function handleConfirmar() {
    startTransition(async () => {
      const result = await cancelarPedidoAction(pedidoId)
      if (result.error) {
        setError(result.error)
        setConfirmando(false)
      }
      // Si ok=true, revalidatePath refresca la página automáticamente
    })
  }

  if (confirmando) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ¿Confirmás la cancelación? El stock se restaurará y se le notificará al cliente.
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirmar}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <XCircle className="h-3 w-3" aria-hidden="true" />
            )}
            {isPending ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
          <button
            onClick={handleCancelar}
            disabled={isPending}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Cancelar pedido
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
