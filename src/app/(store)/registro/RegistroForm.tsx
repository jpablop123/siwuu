'use client'

import { useState, useTransition } from 'react'
import { registrarse } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Mail } from 'lucide-react'
import Link from 'next/link'
import { registroSchema, flattenErrors } from '@/lib/validators/auth'
import { PhoneInput } from '@/components/ui/PhoneInput'

interface FieldErrors {
  nombre?: string
  email?: string
  telefono?: string
  password?: string
  confirmarPassword?: string
  aceptaTerminos?: string
  aceptaPrivacidad?: string
  global?: string
}

export function RegistroForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [registrado, setRegistrado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Validación cliente con el MISMO schema que usa el servidor.
    const parsed = registroSchema.safeParse({
      nombre:             formData.get('nombre')?.toString() ?? '',
      email:              formData.get('email')?.toString() ?? '',
      telefono:           formData.get('telefono')?.toString() ?? '',
      password:           formData.get('password')?.toString() ?? '',
      confirmarPassword:  formData.get('confirmarPassword')?.toString() ?? '',
      aceptaTerminos:     formData.get('aceptaTerminos')?.toString() ?? '',
      aceptaPrivacidad:   formData.get('aceptaPrivacidad')?.toString() ?? '',
      website:            formData.get('website')?.toString() ?? '',
    })

    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error))
      return
    }

    setErrors({})
    startTransition(async () => {
      const result = await registrarse(formData)
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors)
      } else if (result?.error) {
        setErrors({ global: result.error })
      } else if (result?.ok) {
        setRegistrado(true)
      }
    })
  }

  if (registrado) {
    return (
      <div className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-8 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-500/20">
          <Mail className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">¡Casi listo!</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-400">
          Si el email es nuevo, te enviamos un link de confirmación. Si ya tenías cuenta,
          podés iniciar sesión directamente o recuperar tu contraseña.
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.global && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" role="alert">
          {errors.global}
        </div>
      )}

      {/* Honeypot — invisible para humanos, los bots lo llenan.
          tabIndex=-1 y aria-hidden=true para que screen readers no lo anuncien. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        <label htmlFor="website">Dejá este campo vacío</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <Input
        label="Nombre completo"
        name="nombre"
        required
        placeholder="Tu nombre"
        autoComplete="name"
        maxLength={100}
        error={errors.nombre}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        required
        placeholder="tu@email.com"
        autoComplete="email"
        maxLength={254}
        error={errors.email}
      />

      <PhoneInput
        label="Teléfono"
        name="telefono"
        value=""
        onChange={() => { /* uncontrolled — el hidden input lleva el valor a FormData */ }}
        required
        error={errors.telefono}
      />

      <div className="relative">
        <Input
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Mínimo 10 caracteres"
          autoComplete="new-password"
          maxLength={128}
          error={errors.password}
          hint={!errors.password ? 'Mínimo 10 caracteres, no debe contener tu nombre o email' : undefined}
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
          maxLength={128}
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

      {/* Habeas Data — Ley 1581 de 2012 */}
      <div className="space-y-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700/50 dark:bg-zinc-900/30">
        <label className="flex items-start gap-3 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="checkbox"
            name="aceptaTerminos"
            value="on"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 focus:ring-emerald-500 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-emerald-500 dark:focus:ring-offset-zinc-900"
          />
          <span className="leading-relaxed">
            Acepto los{' '}
            <Link
              href="/terminos"
              target="_blank"
              className="font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-400"
            >
              Términos y Condiciones
            </Link>
          </span>
        </label>
        {errors.aceptaTerminos && (
          <p className="ml-7 text-xs text-red-700 dark:text-red-400" role="alert">{errors.aceptaTerminos}</p>
        )}

        <label className="flex items-start gap-3 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="checkbox"
            name="aceptaPrivacidad"
            value="on"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 focus:ring-emerald-500 focus:ring-offset-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-emerald-500 dark:focus:ring-offset-zinc-900"
          />
          <span className="leading-relaxed">
            Autorizo el tratamiento de mis datos personales según la{' '}
            <Link
              href="/politica-privacidad"
              target="_blank"
              className="font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-400"
            >
              Política de Tratamiento de Datos
            </Link>{' '}
            (Ley 1581 de 2012)
          </span>
        </label>
        {errors.aceptaPrivacidad && (
          <p className="ml-7 text-xs text-red-700 dark:text-red-400" role="alert">{errors.aceptaPrivacidad}</p>
        )}
      </div>

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          Iniciá sesión
        </Link>
      </p>
    </form>
  )
}
