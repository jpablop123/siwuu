'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { Plus, Trash2 } from 'lucide-react'
import type { Producto, Categoria, Proveedor, Variante } from '@/types'

interface ProductFormProps {
  producto?: Producto & { variantes?: Variante[] }
  categorias: Categoria[]
  proveedores: Proveedor[]
}

export function ProductForm({ producto, categorias, proveedores }: ProductFormProps) {
  const router = useRouter()
  const addToast = useToast((s) => s.addToast)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    slug: producto?.slug || '',
    descripcion: producto?.descripcion || '',
    descripcion_corta: producto?.descripcion_corta || '',
    categoria_id: producto?.categoria_id || '',
    proveedor_id: producto?.proveedor_id || '',
    precio_venta: producto?.precio_venta?.toString() || '',
    precio_tachado: producto?.precio_tachado?.toString() || '',
    precio_costo: producto?.precio_costo?.toString() || '',
    imagenes: producto?.imagenes?.join('\n') || '',
    url_proveedor: producto?.url_proveedor || '',
    tags: producto?.tags?.join(', ') || '',
    activo: producto?.activo ?? true,
    destacado: producto?.destacado ?? false,
  })

  const [variantes, setVariantes] = useState<{ nombre: string; valor: string }[]>(
    producto?.variantes?.map((v) => ({ nombre: v.nombre, valor: v.valor })) || []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((prev) => ({
      ...prev,
      [name]: val,
      ...(name === 'nombre' && !producto ? { slug: slugify(value) } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const imagenesArr = form.imagenes.split('\n').map((s) => s.trim()).filter(Boolean)
    const tagsArr = form.tags.split(',').map((s) => s.trim()).filter(Boolean)

    const data = {
      nombre: form.nombre,
      slug: form.slug,
      descripcion: form.descripcion || null,
      descripcion_corta: form.descripcion_corta || null,
      categoria_id: form.categoria_id || null,
      proveedor_id: form.proveedor_id || null,
      precio_venta: parseFloat(form.precio_venta),
      precio_tachado: form.precio_tachado ? parseFloat(form.precio_tachado) : null,
      precio_costo: form.precio_costo ? parseFloat(form.precio_costo) : null,
      imagenes: imagenesArr,
      url_proveedor: form.url_proveedor || null,
      tags: tagsArr,
      activo: form.activo,
      destacado: form.destacado,
    }

    let productoId = producto?.id

    if (producto) {
      const { error } = await supabase.from('productos').update(data).eq('id', producto.id)
      if (error) { addToast('Error al actualizar', 'error'); setLoading(false); return }
    } else {
      const { data: nuevo, error } = await supabase.from('productos').insert(data).select().single()
      if (error || !nuevo) { addToast('Error al crear', 'error'); setLoading(false); return }
      productoId = nuevo.id
    }

    // Actualizar variantes
    if (productoId) {
      await supabase.from('variantes').delete().eq('producto_id', productoId)
      if (variantes.length > 0) {
        await supabase.from('variantes').insert(
          variantes.map((v) => ({
            producto_id: productoId!,
            nombre: v.nombre,
            valor: v.valor,
          }))
        )
      }
    }

    addToast(producto ? 'Producto actualizado' : 'Producto creado')
    router.push('/admin/productos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        <Input label="Slug" name="slug" value={form.slug} onChange={handleChange} required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción corta</label>
        <textarea
          name="descripcion_corta"
          value={form.descripcion_corta}
          onChange={handleChange}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción completa (HTML)</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows={6}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-mono text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
          <select name="categoria_id" value={form.categoria_id} onChange={handleChange} className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proveedor</label>
          <select name="proveedor_id" value={form.proveedor_id} onChange={handleChange} className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Precio de venta (COP)" name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} required />
        <Input label="Precio tachado (COP)" name="precio_tachado" type="number" value={form.precio_tachado} onChange={handleChange} />
        <Input label="Precio costo (COP)" name="precio_costo" type="number" value={form.precio_costo} onChange={handleChange} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">URLs de imágenes (una por línea)</label>
        <textarea
          name="imagenes"
          value={form.imagenes}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-mono text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="https://..."
        />
      </div>

      <Input label="URL del producto en el proveedor" name="url_proveedor" value={form.url_proveedor} onChange={handleChange} />
      <Input label="Tags (separados por coma)" name="tags" value={form.tags} onChange={handleChange} />

      {/* Variantes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Variantes</label>
          <button
            type="button"
            onClick={() => setVariantes([...variantes, { nombre: '', valor: '' }])}
            className="flex items-center gap-1 text-sm text-emerald-400 hover:underline"
          >
            <Plus className="h-3 w-3" /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {variantes.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={v.nombre}
                onChange={(e) => {
                  const next = [...variantes]
                  next[i].nombre = e.target.value
                  setVariantes(next)
                }}
                placeholder="Tipo (Color, Talla...)"
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                value={v.valor}
                onChange={(e) => {
                  const next = [...variantes]
                  next[i].valor = e.target.value
                  setVariantes(next)
                }}
                placeholder="Valor (Rojo, XL...)"
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => setVariantes(variantes.filter((_, j) => j !== i))}
                className="p-2 text-red-500 hover:bg-red-900/30 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} className="rounded" />
          Activo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange} className="rounded" />
          Destacado en home
        </label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" loading={loading}>
          {producto ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
