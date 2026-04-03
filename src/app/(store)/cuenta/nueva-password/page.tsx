'use client'

import { useState, useTransition, useEffect } from 'react'
import { actualizarPassword } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

export default function NuevaPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [ready, setReady] = useState(false)
  const router = useRouter()

  // Verificar que hay sesión activa (establecida por auth/callback)
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/recuperar-password')
        return
      }
      setReady(true)
    }
    check()
  }, [router])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    const password = formData.get('password')?.toString() ?? ''
    const confirmar = formData.get('confirmarPassword')?.toString() ?? ''

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    startTransition(async () => {
      const result = await actualizarPassword(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresá tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              label="Nueva contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              hint="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirmar nueva contraseña"
              name="confirmarPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              placeholder="Repetí tu contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" size="lg" loading={isPending} className="w-full">
            Actualizar contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}
