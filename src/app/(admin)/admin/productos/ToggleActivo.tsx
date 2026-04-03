'use client'

import { useState, useTransition } from 'react'
import { toggleProductoActivo } from '@/lib/actions/admin'

interface ToggleActivoProps {
  id: string
  activo: boolean
}

export function ToggleActivo({ id, activo: initialActivo }: ToggleActivoProps) {
  const [activo, setActivo] = useState(initialActivo)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const newValue = !activo
    setActivo(newValue) // optimistic
    startTransition(async () => {
      const result = await toggleProductoActivo(id, newValue)
      if (!result.ok) setActivo(!newValue) // revert
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
        activo ? 'bg-green-500' : 'bg-zinc-600'
      }`}
      role="switch"
      aria-checked={activo}
      aria-label={activo ? 'Desactivar producto' : 'Activar producto'}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
