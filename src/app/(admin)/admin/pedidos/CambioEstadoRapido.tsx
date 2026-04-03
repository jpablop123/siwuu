'use client'

import { useState, useTransition } from 'react'
import { actualizarEstadoPedido } from '@/lib/actions/admin'

const ESTADOS: { value: string; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pago_confirmado', label: 'Pago confirmado' },
  { value: 'procesando', label: 'Procesando' },
  { value: 'enviado_proveedor', label: 'Enviado proveedor' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

interface CambioEstadoRapidoProps {
  pedidoId: string
  estadoActual: string
}

export function CambioEstadoRapido({ pedidoId, estadoActual }: CambioEstadoRapidoProps) {
  const [estado, setEstado] = useState(estadoActual)
  const [isPending, startTransition] = useTransition()

  const handleChange = (nuevoEstado: string) => {
    const prevEstado = estado
    setEstado(nuevoEstado) // optimistic
    startTransition(async () => {
      const result = await actualizarEstadoPedido(pedidoId, nuevoEstado)
      if (!result.ok) {
        setEstado(prevEstado) // revert
      }
    })
  }

  return (
    <select
      value={estado}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      aria-label="Cambiar estado"
    >
      {ESTADOS.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </select>
  )
}
