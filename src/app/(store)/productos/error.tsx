'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function ProductosError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20">
      <AlertTriangle className="h-16 w-16 text-red-400" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold text-zinc-100">
        Error al cargar productos
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Ocurrió un problema al obtener los productos. Por favor intenta de nuevo.
      </p>
      <Button onClick={reset} className="mt-6">
        Reintentar
      </Button>
    </div>
  )
}
