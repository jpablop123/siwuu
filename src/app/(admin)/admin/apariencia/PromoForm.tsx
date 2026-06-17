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

const FEATURE_FIELDS: Array<[keyof ConfiguracionTiendaInput, keyof ConfiguracionTiendaInput, string]> = [
  ['feature_1_titulo', 'feature_1_desc', '1'],
  ['feature_2_titulo', 'feature_2_desc', '2'],
  ['feature_3_titulo', 'feature_3_desc', '3'],
  ['feature_4_titulo', 'feature_4_desc', '4'],
]

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
    feature_1_titulo: config.feature_1_titulo ?? 'Entrega en la puerta de tu casa',
    feature_1_desc: config.feature_1_desc ?? 'Te lo llevamos a domicilio en cualquier ciudad de Colombia.',
    feature_2_titulo: config.feature_2_titulo ?? 'Directo desde USA',
    feature_2_desc: config.feature_2_desc ?? 'Tu personal shopper compra en Estados Unidos y lo trae por ti.',
    feature_3_titulo: config.feature_3_titulo ?? 'Pago 100% protegido',
    feature_3_desc: config.feature_3_desc ?? 'Procesamos con Wompi — la plataforma más segura de Colombia.',
    feature_4_titulo: config.feature_4_titulo ?? 'Soporte local',
    feature_4_desc: config.feature_4_desc ?? 'Atención en español, respuesta en menos de 24 h.',
    footer_descripcion: config.footer_descripcion ?? '',
    footer_whatsapp: config.footer_whatsapp ?? '573001234567',
    footer_email: config.footer_email ?? 'info@siwuushop.co',
    footer_ubicacion: config.footer_ubicacion ?? 'Bogotá, Colombia',
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

      {/* ── Barra "Por qué elegirnos" ─────────────────────────────── */}
      <div className="border-t border-zinc-200 pt-5 dark:border-zinc-700">
        <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Barra &quot;Por qué elegirnos&quot; (4 bloques de la home)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURE_FIELDS.map(([tKey, dKey, n]) => (
            <div key={n} className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <Input
                label={`Bloque ${n} — título`}
                value={(form[tKey] as string) ?? ''}
                onChange={(e) => set(tKey, e.target.value)}
              />
              <Input
                label={`Bloque ${n} — descripción`}
                value={(form[dKey] as string) ?? ''}
                onChange={(e) => set(dKey, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 pt-5 dark:border-zinc-700">
        <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Footer</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descripción
            </label>
            <textarea
              value={form.footer_descripcion ?? ''}
              onChange={(e) => set('footer_descripcion', e.target.value)}
              rows={2}
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <Input
            label="WhatsApp (solo números)"
            value={form.footer_whatsapp ?? ''}
            onChange={(e) => set('footer_whatsapp', e.target.value)}
            placeholder="573001234567"
          />
          <Input
            label="Email de contacto"
            value={form.footer_email ?? ''}
            onChange={(e) => set('footer_email', e.target.value)}
          />
          <Input
            label="Ubicación"
            value={form.footer_ubicacion ?? ''}
            onChange={(e) => set('footer_ubicacion', e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
      )}

      {saved && (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
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
