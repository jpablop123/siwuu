'use client'

import { useState, useTransition } from 'react'
import { iniciarSesion } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  redirectTo?: string
  linkError?: boolean
}

export function LoginForm({ redirectTo, linkError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await iniciarSesion(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {linkError && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-300">
          El link expiró. Solicitá uno nuevo.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" role="alert">
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

      <div className="relative">
        <Input
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Tu contraseña"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="text-right">
        <Link
          href="/recuperar-password"
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
