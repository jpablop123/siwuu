'use client'

/**
 * BannersManager — gestiona los slides del hero carousel desde el admin.
 * Permite crear, editar, activar/desactivar y eliminar banners.
 */

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  crearBannerHero,
  actualizarBannerHero,
  eliminarBannerHero,
  type BannerHeroInput,
} from '@/lib/actions/admin'
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TiendaBanner {
  id: string
  titulo: string
  subtitulo: string | null
  tag: string | null
  imagen_url: string
  cta_label: string
  cta_href: string
  cta_secundario_label: string | null
  cta_secundario_href: string | null
  align: 'left' | 'center'
  activo: boolean
  orden: number
}

interface BannersManagerProps {
  banners: TiendaBanner[]
}

const FORM_EMPTY: BannerHeroInput = {
  titulo: '',
  subtitulo: '',
  tag: '',
  imagen_url: '',
  cta_label: 'Ver catálogo',
  cta_href: '/productos',
  cta_secundario_label: '',
  cta_secundario_href: '',
  align: 'left',
  orden: 0,
  activo: true,
}

function BannerForm({
  initial,
  onSave,
  onCancel,
  loading,
  error,
}: {
  initial: BannerHeroInput
  onSave: (data: BannerHeroInput) => void
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  const [form, setForm] = useState<BannerHeroInput>(initial)

  const set = (key: keyof BannerHeroInput, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      {/* Imagen */}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Imagen del banner <span className="text-rose-500">*</span>
        </p>
        <ImageUploader
          value={form.imagen_url ? [form.imagen_url] : []}
          onChange={(urls) => set('imagen_url', urls[0] ?? '')}
          max={1}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Título *"
          value={form.titulo}
          onChange={(e) => set('titulo', e.target.value)}
          placeholder="Ej: Sonido sin límites"
        />
        <Input
          label="Etiqueta (badge)"
          value={form.tag ?? ''}
          onChange={(e) => set('tag', e.target.value)}
          placeholder="Ej: Nueva colección"
        />
        <Input
          label="Subtítulo"
          value={form.subtitulo ?? ''}
          onChange={(e) => set('subtitulo', e.target.value)}
          placeholder="Descripción corta del banner"
          className="sm:col-span-2"
        />
        <Input
          label="Label botón principal"
          value={form.cta_label}
          onChange={(e) => set('cta_label', e.target.value)}
        />
        <Input
          label="Enlace botón principal"
          value={form.cta_href}
          onChange={(e) => set('cta_href', e.target.value)}
          placeholder="/productos"
        />
        <Input
          label="Label botón secundario"
          value={form.cta_secundario_label ?? ''}
          onChange={(e) => set('cta_secundario_label', e.target.value)}
          placeholder="Opcional"
        />
        <Input
          label="Enlace botón secundario"
          value={form.cta_secundario_href ?? ''}
          onChange={(e) => set('cta_secundario_href', e.target.value)}
          placeholder="/categoria/..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Alineación del texto
          </label>
          <select
            value={form.align}
            onChange={(e) => set('align', e.target.value as 'left' | 'center')}
            className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="left">Izquierda</option>
            <option value="center">Centrado</option>
          </select>
        </div>
        <Input
          label="Orden (menor = primero)"
          type="number"
          value={String(form.orden ?? 0)}
          onChange={(e) => set('orden', parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="activo-check"
          checked={form.activo !== false}
          onChange={(e) => set('activo', e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
        <label htmlFor="activo-check" className="text-sm text-zinc-700 dark:text-zinc-300">
          Banner activo (visible en la tienda)
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => onSave(form)}
          loading={loading}
          disabled={!form.titulo.trim() || !form.imagen_url}
        >
          <Check className="h-4 w-4" />
          Guardar banner
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" disabled={loading}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export function BannersManager({ banners: initialBanners }: BannersManagerProps) {
  const [banners, setBanners] = useState(initialBanners)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCreate = (data: BannerHeroInput) => {
    setFormError(null)
    startTransition(async () => {
      const result = await crearBannerHero(data)
      if (!result.ok) {
        setFormError(result.error ?? 'Error al guardar')
        return
      }
      // Optimistic: refetch happens via revalidatePath on server; close form
      setShowCreate(false)
      // Add placeholder to list (server will revalidate)
      setBanners((prev) => [
        ...prev,
        {
          id: result.id ?? crypto.randomUUID(),
          ...data,
          subtitulo: data.subtitulo ?? null,
          tag: data.tag ?? null,
          cta_secundario_label: data.cta_secundario_label ?? null,
          cta_secundario_href: data.cta_secundario_href ?? null,
          activo: data.activo !== false,
          orden: data.orden ?? 0,
        },
      ])
    })
  }

  const handleUpdate = (id: string, data: BannerHeroInput) => {
    setFormError(null)
    startTransition(async () => {
      const result = await actualizarBannerHero(id, data)
      if (!result.ok) {
        setFormError(result.error ?? 'Error al actualizar')
        return
      }
      setEditingId(null)
      setBanners((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                ...data,
                subtitulo: data.subtitulo ?? null,
                tag: data.tag ?? null,
                cta_secundario_label: data.cta_secundario_label ?? null,
                cta_secundario_href: data.cta_secundario_href ?? null,
              }
            : b,
        ),
      )
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return
    startTransition(async () => {
      await eliminarBannerHero(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
    })
  }

  const handleToggleActivo = (id: string, activo: boolean) => {
    startTransition(async () => {
      await actualizarBannerHero(id, { activo: !activo } as Partial<BannerHeroInput>)
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, activo: !activo } : b)))
    })
  }

  const sorted = [...banners].sort((a, b) => a.orden - b.orden)

  return (
    <div className="space-y-4">
      {/* Lista de banners existentes */}
      {sorted.length > 0 && (
        <ul className="space-y-3">
          {sorted.map((banner) => (
            <li key={banner.id} className="space-y-3">
              {editingId === banner.id ? (
                <BannerForm
                  initial={{
                    titulo: banner.titulo,
                    subtitulo: banner.subtitulo,
                    tag: banner.tag,
                    imagen_url: banner.imagen_url,
                    cta_label: banner.cta_label,
                    cta_href: banner.cta_href,
                    cta_secundario_label: banner.cta_secundario_label,
                    cta_secundario_href: banner.cta_secundario_href,
                    align: banner.align,
                    orden: banner.orden,
                    activo: banner.activo,
                  }}
                  onSave={(data) => handleUpdate(banner.id, data)}
                  onCancel={() => setEditingId(null)}
                  loading={isPending}
                  error={formError}
                />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <GripVertical className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />

                  {/* Thumbnail */}
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    <Image src={banner.imagen_url} alt="" fill className="object-cover" sizes="80px" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {banner.titulo}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Orden: {banner.orden} · {banner.align === 'left' ? 'Texto izquierda' : 'Texto centrado'}
                    </p>
                  </div>

                  {/* Estado + acciones */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        banner.activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800',
                      )}
                    >
                      {banner.activo ? 'Activo' : 'Oculto'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(banner.id, banner.activo)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      aria-label={banner.activo ? 'Ocultar' : 'Activar'}
                    >
                      {banner.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(banner.id)
                        setFormError(null)
                      }}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {banners.length === 0 && !showCreate && (
        <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No hay banners. Crea el primero para que aparezca en el hero.
        </p>
      )}

      {/* Formulario crear */}
      {showCreate && (
        <BannerForm
          initial={FORM_EMPTY}
          onSave={handleCreate}
          onCancel={() => {
            setShowCreate(false)
            setFormError(null)
          }}
          loading={isPending}
          error={formError}
        />
      )}

      {!showCreate && (
        <Button
          type="button"
          onClick={() => {
            setShowCreate(true)
            setEditingId(null)
            setFormError(null)
          }}
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          Agregar banner
        </Button>
      )}
    </div>
  )
}
