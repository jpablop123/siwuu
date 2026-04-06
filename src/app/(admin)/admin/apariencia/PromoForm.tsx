'use client'

/**
 * PromoForm — edita los campos del banner promocional 50/50 desde el admin.
 * Usa ImageUploader para la imagen del lado derecho.
 */

import { useState, useTransition } from 'react'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { actualizarConfiguracionTienda, type ConfiguracionTiendaInput } from '@/lib/actions/admin'
import { Check } from 'lucide-react'

interface PromoFormProps {
  config: ConfiguracionTiendaInput & { promo_imagen?: string | null }
}

export function PromoForm({ config }: PromoFormProps) {
  const [form, setForm] = useState<ConfiguracionTiendaInput>({
    promo_tag: config.promo_tag ?? 'Colección exclusiva',
    promo_titulo: config.promo_titulo ?? 'Audio que cambia todo',
    promo_descripcion: config.promo_descripcion ?? '',
    promo_descuento: config.promo_descuento ?? '20% OFF',
    promo_cta_label: config.promo_cta_label ?? 'Comprar ahora',
    promo_cta_href: config.promo_cta_href ?? '/productos',
    promo_imagen: config.promo_imagen ?? null,
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof ConfiguracionTiendaInput, value: string | null) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = () => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await actualizarConfiguracionTienda(form)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Imagen */}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Imagen del banner (lado derecho)
        </p>
        <ImageUploader
          value={form.promo_imagen ? [form.promo_imagen] : []}
          onChange={(urls) => set('promo_imagen', urls[0] ?? null)}
          max={1}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Etiqueta (badge)"
          value={form.promo_tag}
          onChange={(e) => set('promo_tag', e.target.value)}
          placeholder="Ej: Colección exclusiva"
        />
        <Input
          label="Badge de descuento"
          value={form.promo_descuento}
          onChange={(e) => set('promo_descuento', e.target.value)}
          placeholder="Ej: 20% OFF"
        />
        <Input
          label="Título"
          value={form.promo_titulo}
          onChange={(e) => set('promo_titulo', e.target.value)}
          placeholder="Ej: Audio que\ncambia todo"
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Descripción
          </label>
          <textarea
            value={form.promo_descripcion ?? ''}
            onChange={(e) => set('promo_descripcion', e.target.value)}
            rows={3}
            className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Descripción del producto o promoción..."
          />
        </div>
        <Input
          label="Label del botón"
          value={form.promo_cta_label}
          onChange={(e) => set('promo_cta_label', e.target.value)}
        />
        <Input
          label="Enlace del botón"
          value={form.promo_cta_href}
          onChange={(e) => set('promo_cta_href', e.target.value)}
          placeholder="/productos/..."
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>
      )}

      {saved && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          ✓ Cambios guardados correctamente
        </p>
      )}

      <Button onClick={handleSave} loading={isPending}>
        <Check className="h-4 w-4" />
        {isPending ? 'Guardando...' : 'Guardar banner promocional'}
      </Button>
    </div>
  )
}
