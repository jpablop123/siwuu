'use client'

import { useState, useTransition } from 'react'
import { convertirInvitadoAUsuario } from '@/lib/actions/cuenta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Sparkles, CheckCircle2, UserPlus } from 'lucide-react'

interface PostCheckoutRegisterProps {
  email: string
}

export function PostCheckoutRegister({ email }: PostCheckoutRegisterProps) {
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Estado de éxito ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">¡Cuenta creada!</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Revisá tu correo para confirmarla. Una vez activa, todos tus pedidos aparecerán en{' '}
            <span className="font-medium text-emerald-500">Mis pedidos</span> automáticamente.
          </p>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setClientError(null)

    if (password.length < 8) {
      setClientError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    startTransition(async () => {
      const result = await convertirInvitadoAUsuario(email, password)
      if (result.ok) {
        setDone(true)
      } else {
        setClientError(result.error)
      }
    })
  }

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-6 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Sparkles className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
            ¡Guardá tus datos para la próxima!
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            Creá tu cuenta y rastreá este pedido sin necesidad de buscar el email.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email disabled — ya lo tenemos del pedido */}
        <Input
          label="Email"
          type="email"
          value={email}
          disabled
          readOnly
          aria-label="Email del pedido (no editable)"
        />

        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => {
            setClientError(null)
            setPassword(e.target.value)
          }}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={clientError ?? undefined}
          required
          minLength={8}
        />

        <Button
          type="submit"
          loading={isPending}
          disabled={password.length === 0}
          className="w-full"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isPending ? 'Creando cuenta...' : 'Crear mi cuenta'}
        </Button>
      </form>
    </div>
  )
}
