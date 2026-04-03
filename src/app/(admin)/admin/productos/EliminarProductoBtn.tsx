'use client'

import { useTransition } from 'react'
import { eliminarProducto } from '@/lib/actions/admin'
import { Trash2 } from 'lucide-react'

interface EliminarProductoBtnProps {
  id: string
  nombre: string
}

export function EliminarProductoBtn({ id, nombre }: EliminarProductoBtnProps) {
  const [isPending, startTransition] = useTransition()

  const handleEliminar = () => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await eliminarProducto(id)
      if (result.error) {
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleEliminar}
      disabled={isPending}
      className="text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
      aria-label={`Eliminar ${nombre}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
