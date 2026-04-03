'use client'

import { useState, useTransition } from 'react'
import { recuperarPassword } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RecuperarPasswordPage() {
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await recuperarPassword(formData)
      if (result.ok) {
        setEnviado(true)
      } else if (result.error) {
        setError(result.error)
      }
    })
  }

  if (enviado) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
        <div className="w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <Mail className="h-8 w-8 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Revisá tu bandeja de entrada</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Te enviamos instrucciones para recuperar tu contraseña.
            El link expira en 1 hora.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresá tu email y te enviaremos instrucciones
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            autoComplete="email"
          />

          <Button type="submit" size="lg" loading={isPending} className="w-full">
            Enviar instrucciones
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-emerald-400 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
