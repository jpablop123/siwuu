'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  crearProducto,
  actualizarProducto,
  crearVariante,
  eliminarVariante,
} from '@/lib/actions/admin'
import { formatCOP } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { X, Plus, Check } from 'lucide-react'
import { ImageUploader } from '@/components/admin/ImageUploader'
import type { Producto, Categoria, Proveedor, Variante } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocalVariante {
  id?: string
  nombre: string
  valor: string
  precio_adicional: number
  disponible: boolean
}

interface ProductoFormProps {
  mode: 'crear' | 'editar'
  producto?: Producto & { variantes?: Variante[] }
  categorias: Categoria[]
  proveedores: Proveedor[]
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductoForm({ mode, producto, categorias, proveedores }: ProductoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [slug, setSlug] = useState(producto?.slug ?? '')
  const [descripcionCorta, setDescripcionCorta] = useState(producto?.descripcion_corta ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? '')
  const [proveedorId, setProveedorId] = useState(producto?.proveedor_id ?? '')
  const [urlProveedor, setUrlProveedor] = useState(producto?.url_proveedor ?? '')
  const [precioVenta, setPrecioVenta] = useState(producto?.precio_venta?.toString() ?? '')
  const [precioTachado, setPrecioTachado] = useState(producto?.precio_tachado?.toString() ?? '')
  const [precioCosto, setPrecioCosto] = useState(producto?.precio_costo?.toString() ?? '')
  const [imagenes, setImagenes] = useState<string[]>(producto?.imagenes ?? [])
  const [activo, setActivo] = useState(producto?.activo ?? true)
  const [destacado, setDestacado] = useState(producto?.destacado ?? false)
  const [stockVirtual, setStockVirtual] = useState(producto?.stock_virtual?.toString() ?? '999')
  const [tags, setTags] = useState<string[]>(producto?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [variantes, setVariantes] = useState<LocalVariante[]>(
    producto?.variantes?.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      valor: v.valor,
      precio_adicional: v.precio_adicional,
      disponible: v.disponible,
    })) ?? []
  )

  // Variante form
  const [vNombre, setVNombre] = useState('')
  const [vValor, setVValor] = useState('')
  const [vPrecio, setVPrecio] = useState('0')
  const [vDisponible, setVDisponible] = useState(true)

  // Feedback
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  // Computed
  const pv = parseInt(precioVenta) || 0
  const pc = parseInt(precioCosto) || 0
  const margen = pv > 0 && pc > 0 ? (((pv - pc) / pv) * 100).toFixed(0) : null
  const ganancia = pv > 0 && pc > 0 ? pv - pc : null

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleNombreChange = (val: string) => {
    setNombre(val)
    if (mode === 'crear') setSlug(generarSlug(val))
  }

  const handleDescripcionCorta = (val: string) => {
    if (val.length <= 160) setDescripcionCorta(val)
  }

  const addTag = (val: string) => {
    const tag = val.trim()
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const addVariante = async () => {
    if (!vNombre.trim() || !vValor.trim()) return

    if (mode === 'editar' && producto) {
      const fd = new FormData()
      fd.set('nombre', vNombre.trim())
      fd.set('valor', vValor.trim())
      fd.set('precio_adicional', vPrecio)
      fd.set('disponible', vDisponible.toString())
      const result = await crearVariante(producto.id, fd)
      if (result.ok) {
        setVariantes((prev) => [
          ...prev,
          {
            id: result.varianteId,
            nombre: vNombre.trim(),
            valor: vValor.trim(),
            precio_adicional: parseFloat(vPrecio) || 0,
            disponible: vDisponible,
          },
        ])
      }
    } else {
      setVariantes((prev) => [
        ...prev,
        {
          nombre: vNombre.trim(),
          valor: vValor.trim(),
          precio_adicional: parseFloat(vPrecio) || 0,
          disponible: vDisponible,
        },
      ])
    }
    setVNombre('')
    setVValor('')
    setVPrecio('0')
    setVDisponible(true)
  }

  const removeVariante = async (index: number) => {
    const v = variantes[index]
    if (mode === 'editar' && v.id && producto) {
      if (!confirm('¿Eliminar esta variante?')) return
      await eliminarVariante(v.id, producto.id)
    }
    setVariantes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) return setError('Nombre es requerido')
    if (!precioVenta || pv <= 0) return setError('Precio de venta es requerido')

    const fd = new FormData()
    fd.set('nombre', nombre.trim())
    fd.set('descripcion_corta', descripcionCorta)
    fd.set('descripcion', descripcion)
    fd.set('categoria_id', categoriaId)
    fd.set('proveedor_id', proveedorId)
    fd.set('url_proveedor', urlProveedor)
    fd.set('precio_venta', precioVenta)
    fd.set('precio_tachado', precioTachado)
    fd.set('precio_costo', precioCosto)
    fd.set('imagenes', JSON.stringify(imagenes))
    fd.set('tags', JSON.stringify(tags))
    fd.set('destacado', destacado.toString())
    fd.set('activo', activo.toString())
    fd.set('stock_virtual', stockVirtual)
    if (mode === 'crear') {
      fd.set('slug', slug)
      // Variantes locales para modo crear
      const variantesLocales = variantes.map((v) => ({
        nombre: v.nombre,
        valor: v.valor,
        precio_adicional: v.precio_adicional,
        disponible: v.disponible,
      }))
      fd.set('variantes_nuevas', JSON.stringify(variantesLocales))
    }

    startTransition(async () => {
      const result =
        mode === 'crear' ? await crearProducto(fd) : await actualizarProducto(producto!.id, fd)

      if (result.ok) {
        if (mode === 'crear') {
          router.push('/admin/productos')
        } else {
          setGuardado(true)
          setTimeout(() => setGuardado(false), 3000)
        }
      } else {
        setError(result.error || 'Error al guardar')
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Información básica */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Información básica
            </h3>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={nombre}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNombreChange(e.target.value)}
                required
                placeholder="Nombre del producto"
              />
              <div>
                <Input
                  label="Slug"
                  value={slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => mode === 'crear' && setSlug(e.target.value)}
                  readOnly={mode === 'editar'}
                  placeholder="url-del-producto"
                />
                <p className="mt-1 text-xs text-zinc-500">URL: /productos/{slug || '...'}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descripción corta
                </label>
                <textarea
                  value={descripcionCorta}
                  onChange={(e) => handleDescripcionCorta(e.target.value)}
                  rows={2}
                  maxLength={160}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Descripción breve para SEO y catálogo"
                />
                <p className="mt-1 text-right text-xs text-zinc-500">
                  {descripcionCorta.length}/160
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descripción larga
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Descripción completa del producto"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proveedor</label>
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                label="URL del producto en el proveedor"
                value={urlProveedor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlProveedor(e.target.value)}
                placeholder="https://aliexpress.com/item/..."
              />
            </div>
          </div>

          {/* Precios */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Precios
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Precio de venta (COP)"
                type="number"
                value={precioVenta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrecioVenta(e.target.value)}
                required
                min="0"
                step="1"
              />
              <Input
                label="Precio tachado (COP)"
                type="number"
                value={precioTachado}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrecioTachado(e.target.value)}
                min="0"
                step="1"
              />
              <Input
                label="Precio costo (COP)"
                type="number"
                value={precioCosto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrecioCosto(e.target.value)}
                min="0"
                step="1"
              />
            </div>
            {margen && ganancia !== null && (
              <p
                className={`mt-3 text-sm font-medium ${
                  parseInt(margen) > 30
                    ? 'text-emerald-400'
                    : parseInt(margen) >= 15
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                Margen: {margen}% · Ganancia por unidad: {formatCOP(ganancia)}
              </p>
            )}
          </div>

          {/* Imágenes */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Imágenes (máx 5)
            </h3>
            <ImageUploader value={imagenes} onChange={setImagenes} max={5} />
          </div>
        </div>

        {/* Columna lateral (1/3) */}
        <div className="space-y-6">
          {/* Configuración */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Configuración
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700"
                />
                Producto activo
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700"
                />
                Destacado en home
              </label>
              <Input
                label="Stock virtual"
                type="number"
                value={stockVirtual}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockVirtual(e.target.value)}
                min="0"
                hint="En dropshipping suele ser 999"
              />
            </div>
          </div>

          {/* Variantes */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Variantes
            </h3>

            {/* Lista existentes */}
            {variantes.length > 0 && (
              <ul className="mb-4 space-y-2">
                {variantes.map((v, i) => (
                  <li key={v.id || i} className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                    <div>
                      <span className="font-medium">{v.nombre}: {v.valor}</span>
                      {v.precio_adicional > 0 && (
                        <span className="ml-1 text-zinc-500">(+{formatCOP(v.precio_adicional)})</span>
                      )}
                      <span className={`ml-2 text-xs ${v.disponible ? 'text-green-600' : 'text-red-500'}`}>
                        {v.disponible ? '\u2713' : '\u2717'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariante(i)}
                      className="text-red-400 hover:text-red-600"
                      aria-label="Eliminar variante"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Agregar nueva */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={vNombre}
                  onChange={(e) => setVNombre(e.target.value)}
                  placeholder="Nombre (Color)"
                  className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  value={vValor}
                  onChange={(e) => setVValor(e.target.value)}
                  placeholder="Valor (Rojo)"
                  className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={vPrecio}
                  onChange={(e) => setVPrecio(e.target.value)}
                  placeholder="Precio +"
                  min="0"
                  className="w-24 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={vDisponible}
                    onChange={(e) => setVDisponible(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700"
                  />
                  Disponible
                </label>
              </div>
              <button
                type="button"
                onClick={addVariante}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar variante
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Tags
            </h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    aria-label={`Eliminar tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Escribí y presioná Enter"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 z-10 mt-6 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Guardando...' : mode === 'crear' ? 'Crear producto' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/productos')}>
          Cancelar
        </Button>
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
      </div>
    </form>
  )
}
