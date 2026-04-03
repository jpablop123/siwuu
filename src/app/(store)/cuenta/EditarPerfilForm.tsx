'use client'

import { useState, useTransition } from 'react'
import { actualizarPerfil } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'

interface EditarPerfilFormProps {
  perfil: { nombre: string; telefono: string; email: string }
}

export function EditarPerfilForm({ perfil }: EditarPerfilFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setGuardado(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await actualizarPerfil(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.ok) {
        setGuardado(true)
        setTimeout(() => setGuardado(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Nombre completo"
        name="nombre"
        defaultValue={perfil.nombre}
        required
        autoComplete="name"
      />

      <Input
        label="Teléfono"
        name="telefono"
        type="tel"
        defaultValue={perfil.telefono}
        placeholder="+57 300 000 0000"
        autoComplete="tel"
      />

      <div>
        <Input
          label="Email"
          value={perfil.email}
          disabled
          hint="El email no puede modificarse"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          Guardar cambios
        </Button>
        {guardado && (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            <Check className="h-4 w-4" aria-hidden="true" />
            Cambios guardados
          </span>
        )}
      </div>
    </form>
  )
}
