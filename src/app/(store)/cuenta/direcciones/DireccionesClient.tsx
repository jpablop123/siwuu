'use client'

import { useState, useTransition } from 'react'
import { agregarDireccion, eliminarDireccion, marcarDireccionPrincipal } from '@/lib/actions/auth'
import { DEPARTAMENTOS_COLOMBIA } from '@/lib/utils/colombia'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MapPin, Plus, Star, Trash2, X } from 'lucide-react'
import type { Direccion } from '@/types'

interface DireccionesClientProps {
  direcciones: Direccion[]
}

export function DireccionesClient({ direcciones }: DireccionesClientProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAgregar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await agregarDireccion(formData)
      if (result.ok) {
        setMostrarFormulario(false)
      } else if (result.error) {
        setError(result.error)
      }
    })
  }

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return
    startTransition(async () => {
      await eliminarDireccion(id)
    })
  }

  const handlePrincipal = (id: string) => {
    startTransition(async () => {
      await marcarDireccionPrincipal(id)
    })
  }

  return (
    <div className="space-y-6">
      {/* Lista de direcciones */}
      {direcciones.length === 0 && !mostrarFormulario && (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-6 py-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
          <p className="mt-3 text-sm text-zinc-500">No tenés direcciones guardadas</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {direcciones.map((dir) => (
          <div
            key={dir.id}
            className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
          >
            {dir.principal && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <Star className="h-3 w-3" aria-hidden="true" />
                Principal
              </span>
            )}

            <p className="font-medium text-zinc-900 dark:text-zinc-100">{dir.nombre_destinatario}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{dir.direccion}</p>
            {dir.barrio && (
              <p className="text-sm text-zinc-500">Barrio: {dir.barrio}</p>
            )}
            <p className="text-sm text-zinc-500">
              {dir.ciudad}, {dir.departamento}
            </p>
            <p className="text-sm text-zinc-500">Tel: {dir.telefono}</p>
            {dir.indicaciones && (
              <p className="mt-1 text-xs text-zinc-500">
                {dir.indicaciones}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              {!dir.principal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrincipal(dir.id)}
                  disabled={isPending}
                >
                  <Star className="h-3.5 w-3.5" aria-hidden="true" />
                  Marcar principal
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEliminar(dir.id)}
                disabled={isPending}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      {!mostrarFormulario && (
        <Button variant="outline" onClick={() => setMostrarFormulario(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar dirección
        </Button>
      )}

      {/* Formulario nueva dirección */}
      {mostrarFormulario && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nueva dirección</h2>
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false)
                setError('')
              }}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleAgregar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre del destinatario"
                name="nombre_destinatario"
                required
                placeholder="Nombre completo"
                autoComplete="name"
              />
              <Input
                label="Teléfono"
                name="telefono"
                type="tel"
                required
                placeholder="+57 300 000 0000"
                autoComplete="tel"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="departamento"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Departamento
                </label>
                <select
                  id="departamento"
                  name="departamento"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm transition-colors focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>
                  {DEPARTAMENTOS_COLOMBIA.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Ciudad"
                name="ciudad"
                required
                placeholder="Ej: Medellín"
                autoComplete="address-level2"
              />
            </div>

            <Input
              label="Dirección"
              name="direccion"
              required
              placeholder="Calle, carrera, número..."
              autoComplete="street-address"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Barrio"
                name="barrio"
                placeholder="Opcional"
              />
              <Input
                label="Indicaciones"
                name="indicaciones"
                placeholder="Torre, apto, portería..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={isPending}>
                Guardar dirección
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMostrarFormulario(false)
                  setError('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
