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
  const total = subtotal + envio
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wompiReady, setWompiReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [emailTienecuenta, setEmailTienecuenta] = useState(false)
  const [emailCheckTimer, setEmailCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
  }, [])

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
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        if (status === 'APPROVED') {
          vaciarCarrito()
          window.location.href = data.redirectUrl
        } else if (status === 'DECLINED' || status === 'ERROR') {
          setError('El pago fue rechazado. Verificá los datos de tu tarjeta.')
        }
        // PENDING: Wompi redirige al redirectUrl automáticamente
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
              <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Dirección de envío</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Departamento" name="departamento" value={form.departamento} onChange={handleChange} required />
              <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} required />
              <div className="sm:col-span-2">
                <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} required />
              </div>
              <Input label="Barrio" name="barrio" value={form.barrio} onChange={handleChange} />
              <Input label="Indicaciones adicionales" name="indicaciones" value={form.indicaciones} onChange={handleChange} />
            </div>
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
          <div className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
              <Price amount={subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Envío</span>
              <span>{envio === 0 ? 'GRATIS' : <Price amount={envio} />}</span>
            </div>
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
