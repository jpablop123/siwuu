'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCart, useCartTotal } from '@/lib/cart/store'
import { COSTO_ENVIO, COSTO_ENVIO_GRATIS_DESDE } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import Image from 'next/image'
import { Tag, X, MapPin, Plus, Check, Lock } from 'lucide-react'
import { DEPARTAMENTOS, ciudadesDe } from '@/lib/colombia/ubicaciones'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/ui/Combobox'
import { PhoneInput } from '@/components/ui/PhoneInput'
import type { Direccion } from '@/types'

// Tipos globales del widget de Wompi
declare global {
  interface Window {
    WidgetCheckout: new (config: {
      currency: string
      amountInCents: number
      reference: string
      publicKey: string
      redirectUrl: string
      'signature:integrity': string
    }) => {
      open: (callback?: (result: { transaction: { status: string; id: string } }) => void) => void
    }
  }
}

export function CheckoutForm() {
  const { items, vaciarCarrito } = useCart()
  const subtotal = useCartTotal()
  const envio = subtotal >= COSTO_ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO

  const [cuponCodigo, setCuponCodigo] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; descuento: number } | null>(null)
  const [cuponError, setCuponError] = useState<string | null>(null)
  const [validandoCupon, setValidandoCupon] = useState(false)

  const descuento = cuponAplicado?.descuento ?? 0
  const total = Math.max(0, subtotal + envio - descuento)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wompiReady, setWompiReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [emailTienecuenta, setEmailTienecuenta] = useState(false)
  const [emailCheckTimer, setEmailCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Direcciones guardadas + selección actual
  // `selectedDireccionId === 'nueva'` significa "enviar a otra dirección".
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [selectedDireccionId, setSelectedDireccionId] = useState<string | 'nueva'>('nueva')
  const [guardarDireccion, setGuardarDireccion] = useState(false)

  const aplicarCupon = async () => {
    setCuponError(null)
    const codigo = cuponCodigo.trim().toUpperCase()
    if (!codigo) return
    if (subtotal <= 0) {
      setCuponError('Agregá productos al carrito primero')
      return
    }
    setValidandoCupon(true)
    try {
      const res = await fetch('/api/cupones/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          subtotal,
          // Necesarios para validar condiciones: "primera compra",
          // "un uso por cliente" y "solo para una categoría".
          // Si el form todavía no tiene email, el endpoint usará el del JWT.
          email: form.email || null,
          productoIds: items.map((i) => i.productoId),
        }),
      })
      const data = (await res.json()) as { valido: boolean; codigo?: string; descuento?: number; mensaje?: string }
      if (data.valido && data.codigo && typeof data.descuento === 'number') {
        setCuponAplicado({ codigo: data.codigo, descuento: data.descuento })
        setCuponCodigo(data.codigo)
      } else {
        setCuponError(data.mensaje ?? 'Código inválido')
      }
    } catch {
      setCuponError('No pudimos validar el código. Intentá de nuevo.')
    } finally {
      setValidandoCupon(false)
    }
  }

  const quitarCupon = () => {
    setCuponAplicado(null)
    setCuponCodigo('')
    setCuponError(null)
  }

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoggedIn(false)
        return
      }
      setIsLoggedIn(true)

      // En paralelo: profile (para nombre/teléfono) + direcciones guardadas
      const [{ data: profile }, { data: dirs }] = await Promise.all([
        supabase.from('profiles').select('nombre, telefono').eq('id', user.id).single(),
        supabase
          .from('direcciones')
          .select('*')
          .eq('user_id', user.id)
          .order('principal', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      const listaDirs = (dirs as Direccion[]) ?? []
      setDirecciones(listaDirs)

      // Pre-fill datos de contacto desde profile
      setForm((prev) => ({
        ...prev,
        nombre:   prev.nombre   || profile?.nombre   || user.email?.split('@')[0] || '',
        email:    prev.email    || user.email || '',
        telefono: prev.telefono || profile?.telefono || '',
      }))

      // Si hay dirección principal, seleccionarla por default y rellenar
      if (listaDirs.length > 0) {
        const principal = listaDirs.find((d) => d.principal) ?? listaDirs[0]
        setSelectedDireccionId(principal.id)
        setForm((prev) => ({
          ...prev,
          nombre:       principal.nombre_destinatario,
          telefono:     principal.telefono,
          departamento: principal.departamento,
          ciudad:       principal.ciudad,
          direccion:    principal.direccion,
          barrio:       principal.barrio ?? '',
          indicaciones: principal.indicaciones ?? '',
        }))
      }
    }
    void cargarDatosUsuario()
  }, [])

  // Cambiar entre direcciones guardadas o "nueva dirección"
  const seleccionarDireccion = (id: string | 'nueva') => {
    setSelectedDireccionId(id)
    if (id === 'nueva') {
      // Mantener nombre/email/telefono del usuario; limpiar campos de envío
      setForm((prev) => ({
        ...prev,
        departamento: '',
        ciudad: '',
        direccion: '',
        barrio: '',
        indicaciones: '',
      }))
      setGuardarDireccion(false)
    } else {
      const dir = direcciones.find((d) => d.id === id)
      if (dir) {
        setForm((prev) => ({
          ...prev,
          nombre:       dir.nombre_destinatario,
          telefono:     dir.telefono,
          departamento: dir.departamento,
          ciudad:       dir.ciudad,
          direccion:    dir.direccion,
          barrio:       dir.barrio ?? '',
          indicaciones: dir.indicaciones ?? '',
        }))
      }
    }
  }

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    ciudad: '',
    direccion: '',
    barrio: '',
    indicaciones: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    // Verificar email con debounce de 600ms
    if (name === 'email' && !isLoggedIn) {
      if (emailCheckTimer) clearTimeout(emailCheckTimer)
      setEmailTienecuenta(false)
      if (value.includes('@')) {
        const timer = setTimeout(() => {
          fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: value }),
          })
            .then((r) => r.json())
            .then((d: { hasAccount?: boolean }) => setEmailTienecuenta(!!d.hasAccount))
            .catch(() => {})
        }, 600)
        setEmailCheckTimer(timer)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Pasar el token explícitamente para garantizar que el route handler
      // pueda identificar al usuario incluso si las cookies no se leen correctamente
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            productoId: item.productoId,
            nombre: item.nombre,
            imagen: item.imagen,
            variante: item.variante,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
          })),
          subtotal,
          costoEnvio: envio,
          total,
          // El servidor re-valida el cupón con FOR UPDATE y recalcula el descuento.
          // Si fue invalidado entre que se aplicó y el checkout, la transacción aborta.
          codigoCupon: cuponAplicado?.codigo ?? null,
          // Solo guardar si está logueado, eligió "nueva dirección" y tildó el check
          guardarDireccion: isLoggedIn && selectedDireccionId === 'nueva' && guardarDireccion,
        }),
      })

      const data = await response.json()

      if (!data.referencia) {
        setError(data.error ?? 'Error al procesar el pago. Intentá de nuevo.')
        setLoading(false)
        return
      }

      // Abrir el widget embebido de Wompi
      const checkout = new window.WidgetCheckout({
        currency: 'COP',
        amountInCents: data.montoEnCentavos,
        reference: data.referencia,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
        redirectUrl: data.redirectUrl,
        'signature:integrity': data.integrityHash,
      })

      setLoading(false)

      checkout.open((result) => {
        const { status } = result.transaction

        // APPROVED  → tarjeta/Nequi confirmados, vamos a "gracias".
        // PENDING   → PSE / transferencia bancaria: el banco confirmará después.
        //             El pedido ya existe en BD; vaciamos carrito y redirigimos
        //             a la página de "gracias" que mostrará el estado en vivo
        //             vía Realtime de Supabase cuando llegue el webhook.
        //             NO confiamos en Wompi para auto-redirigir.
        if (status === 'APPROVED' || status === 'PENDING') {
          vaciarCarrito()
          window.location.href = data.redirectUrl
          return
        }

        // DECLINED / ERROR / VOIDED → mantenemos el carrito para reintentar.
        if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
          setError('El pago no pudo completarse. Verificá los datos o probá con otro método.')
        }
      })
    } catch (err) {
      console.error('Error al crear pedido:', err)
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.wompi.co/widget.js"
        strategy="lazyOnload"
        onReady={() => setWompiReady(true)}
      />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        {/* Datos de envío */}
        <div className="lg:col-span-2 space-y-6">
          {emailTienecuenta && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Este correo ya tiene una cuenta.{' '}
              <Link href="/login?redirectTo=/checkout" className="font-medium underline hover:no-underline">
                Iniciá sesión
              </Link>{' '}
              para vincular el pedido a tu historial. También podés continuar sin cuenta.
            </div>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold">Datos de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombre completo" name="nombre" value={form.nombre} onChange={handleChange} required />

              {/* Email: bloqueado cuando hay sesión iniciada — el email vive en
                  auth.users y cambiarlo requiere flujo dedicado (con confirmación
                  por email). En checkout solo se muestra, no se edita. */}
              {isLoggedIn ? (
                <div className="w-full">
                  <label htmlFor="email-readonly" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email-readonly"
                      name="email"
                      type="email"
                      value={form.email}
                      readOnly
                      aria-readonly="true"
                      className="flex w-full cursor-not-allowed rounded-xl border-2 border-zinc-200 bg-zinc-100 px-4 py-2.5 pr-10 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
                    />
                    <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Asociado a tu cuenta. Cambialo desde{' '}
                    <Link href="/cuenta" className="text-emerald-700 hover:underline dark:text-emerald-400">
                      Mi perfil
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              )}

              <PhoneInput
                label="Teléfono"
                name="telefono"
                value={form.telefono}
                onChange={(v) => setForm({ ...form, telefono: v })}
                required
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Dirección de envío</h2>

            {/* Picker de direcciones guardadas (solo si logueado y tiene direcciones) */}
            {isLoggedIn && direcciones.length > 0 && (
              <div className="mb-5 space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Mis direcciones guardadas
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {direcciones.map((dir) => {
                    const isSelected = selectedDireccionId === dir.id
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => seleccionarDireccion(dir.id)}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                            : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500',
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                            {dir.nombre_destinatario}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{dir.direccion}</p>
                        <p className="text-xs text-zinc-500">
                          {dir.ciudad}, {dir.departamento} · Tel: {dir.telefono}
                        </p>
                        {dir.principal && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                            Principal
                          </span>
                        )}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    onClick={() => seleccionarDireccion('nueva')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-sm font-medium transition-colors',
                      selectedDireccionId === 'nueva'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-zinc-300 text-zinc-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-emerald-400 dark:hover:text-emerald-300',
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    Enviar a otra dirección
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Combobox
                label="Departamento"
                name="departamento"
                options={DEPARTAMENTOS}
                value={form.departamento}
                onChange={(v) =>
                  // Al cambiar de departamento, la ciudad anterior pierde sentido
                  setForm({ ...form, departamento: v, ciudad: '' })
                }
                placeholder="Seleccioná un departamento"
                searchPlaceholder="Buscar departamento..."
                required
              />
              <Combobox
                label="Ciudad"
                name="ciudad"
                options={ciudadesDe(form.departamento)}
                value={form.ciudad}
                onChange={(v) => setForm({ ...form, ciudad: v })}
                placeholder="Seleccioná una ciudad"
                searchPlaceholder="Buscar ciudad..."
                disabled={!form.departamento}
                disabledMessage="Elegí un departamento primero"
                required
              />
              <div className="sm:col-span-2">
                <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} required placeholder="Calle 123 #45-67" />
              </div>
              <Input label="Barrio" name="barrio" value={form.barrio} onChange={handleChange} />
              <Input label="Indicaciones adicionales" name="indicaciones" value={form.indicaciones} onChange={handleChange} placeholder="Apto, torre, referencias..." />
            </div>

            {/* Guardar nueva dirección — solo si logueado y eligió "nueva" */}
            {isLoggedIn && selectedDireccionId === 'nueva' && (
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={guardarDireccion}
                  onChange={(e) => setGuardarDireccion(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
                />
                Guardar esta dirección en mi cuenta para próximos pedidos
              </label>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!wompiReady}
            className="w-full sm:w-auto"
          >
            {wompiReady ? <>Pagar <Price amount={total} /></> : 'Cargando...'}
          </Button>
        </div>

        {/* Resumen */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Resumen del pedido</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
                  {item.imagen && (
                    <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{item.nombre}</p>
                  {item.variante && <p className="text-xs text-zinc-500">{item.variante}</p>}
                  <p className="text-xs text-zinc-500">x{item.cantidad}</p>
                </div>
                <Price amount={item.precio * item.cantidad} className="text-sm font-medium" />
              </div>
            ))}
          </div>
          {/* Cupón */}
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            {cuponAplicado ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <span className="truncate font-medium text-emerald-800 dark:text-emerald-300">
                    Cupón <span className="font-mono">{cuponAplicado.codigo}</span> aplicado
                  </span>
                </div>
                <button
                  type="button"
                  onClick={quitarCupon}
                  className="shrink-0 rounded p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                  aria-label="Quitar cupón"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cuponCodigo}
                    onChange={(e) => {
                      setCuponCodigo(e.target.value)
                      setCuponError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); aplicarCupon() }
                    }}
                    placeholder="¿Tenés un código de descuento?"
                    maxLength={30}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    aria-label="Código de descuento"
                  />
                  <button
                    type="button"
                    onClick={aplicarCupon}
                    disabled={validandoCupon || !cuponCodigo.trim()}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {validandoCupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {cuponError && (
                  <p className="mt-1.5 text-xs text-red-700 dark:text-red-400" role="alert">
                    {cuponError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
              <Price amount={subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Envío</span>
              <span>{envio === 0 ? 'GRATIS' : <Price amount={envio} />}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Descuento</span>
                <span>−<Price amount={descuento} /></span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2 text-lg font-bold">
              <span>Total</span>
              <Price amount={total} />
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
