'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCart, useCartTotal } from '@/lib/cart/store'
import { COSTO_ENVIO, COSTO_ENVIO_GRATIS_DESDE } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import Image from 'next/image'

export function CheckoutForm() {
  const { items, vaciarCarrito } = useCart()
  const subtotal = useCartTotal()
  const envio = subtotal >= COSTO_ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO
  const total = subtotal + envio
  const [loading, setLoading] = useState(false)
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
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

      if (data.checkoutUrl) {
        vaciarCarrito()
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Error al crear pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      {/* Datos de envío */}
      <div className="lg:col-span-2 space-y-6">
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

        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
          Pagar <Price amount={total} />
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
  )
}
