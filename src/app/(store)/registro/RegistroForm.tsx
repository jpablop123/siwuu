'use client'

import { useState, useTransition } from 'react'
import { registrarse } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Mail } from 'lucide-react'
import Link from 'next/link'

interface FieldErrors {
  nombre?: string
  email?: string
  password?: string
  confirmarPassword?: string
  global?: string
}

export function RegistroForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [registrado, setRegistrado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const validate = (formData: FormData): FieldErrors => {
    const e: FieldErrors = {}
    const nombre = formData.get('nombre')?.toString().trim() ?? ''
    const email = formData.get('email')?.toString().trim() ?? ''
    const password = formData.get('password')?.toString() ?? ''
    const confirmar = formData.get('confirmarPassword')?.toString() ?? ''

    if (nombre.length < 2) e.nombre = 'Mínimo 2 caracteres'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email inválido'
    if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (password !== confirmar) e.confirmarPassword = 'Las contraseñas no coinciden'

    return e
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const fieldErrors = validate(formData)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    startTransition(async () => {
      const result = await registrarse(formData)
      if (result?.error) {
        setErrors({ global: result.error })
      } else if (result?.ok) {
        setRegistrado(true)
      }
    })
  }

  if (registrado) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <Mail className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">¡Cuenta creada!</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Te enviamos un email de confirmación. Revisá tu bandeja de entrada y hacé click en el enlace para activar tu cuenta.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.global && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {errors.global}
        </div>
      )}

      <Input
        label="Nombre completo"
        name="nombre"
        required
        placeholder="Tu nombre"
        autoComplete="name"
        error={errors.nombre}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        required
        placeholder="tu@email.com"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Teléfono"
        name="telefono"
        type="tel"
        placeholder="+57 300 000 0000"
        autoComplete="tel"
      />

      <div className="relative">
        <Input
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={errors.password}
          hint={!errors.password ? 'Mínimo 8 caracteres' : undefined}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-400"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Confirmar contraseña"
          name="confirmarPassword"
          type={showConfirm ? 'text' : 'password'}
          required
          placeholder="Repetí tu contraseña"
          autoComplete="new-password"
          error={errors.confirmarPassword}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-400"
          aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-emerald-400 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  )
}
