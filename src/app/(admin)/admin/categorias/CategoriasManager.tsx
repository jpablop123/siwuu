'use client'

import { useState, useTransition } from 'react'
import { crearCategoria, actualizarCategoria, eliminarCategoria } from '@/lib/actions/admin'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import type { Categoria } from '@/types'

type CategoriaConConteo = Categoria & { productos_count: number }

interface CategoriasManagerProps {
  categorias: CategoriaConConteo[]
}

export function CategoriasManager({ categorias }: CategoriasManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [orden, setOrden] = useState('0')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const resetForm = () => {
    setNombre('')
    setDescripcion('')
    setImagenUrl('')
    setOrden('0')
    setEditingId(null)
    setError('')
  }

  const startEdit = (c: CategoriaConConteo) => {
    setNombre(c.nombre)
    setDescripcion(c.descripcion || '')
    setImagenUrl(c.imagen_url || '')
    setOrden(c.orden.toString())
    setEditingId(c.id)
    setShowForm(true)
    setError('')
  }

  const handleSave = () => {
    if (!nombre.trim()) return setError('Nombre es requerido')
    setError('')

    const fd = new FormData()
    fd.set('nombre', nombre.trim())
    fd.set('descripcion', descripcion)
    fd.set('imagen_url', imagenUrl)
    fd.set('orden', orden)

    startTransition(async () => {
      const result = editingId
        ? await actualizarCategoria(editingId, fd)
        : await crearCategoria(fd)

      if (result.ok) {
        resetForm()
        setShowForm(false)
      } else {
        setError(result.error || 'Error al guardar')
      }
    })
  }

  const handleEliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return
    startTransition(async () => {
      const result = await eliminarCategoria(id)
      if (result.error) alert(result.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Categorías</h1>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm()
              setShowForm(false)
            } else {
              resetForm()
              setShowForm(true)
            }
          }}
          variant={showForm ? 'ghost' : 'default'}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cerrar' : 'Nueva categoría'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400" role="alert">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
              required
            />
            <Input
              label="Descripción"
              value={descripcion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescripcion(e.target.value)}
            />
            <Input
              label="URL imagen"
              value={imagenUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImagenUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Orden"
              type="number"
              value={orden}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrden(e.target.value)}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleSave} loading={isPending}>
              Guardar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {categorias.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {c.imagen_url && (
                  <Image src={c.imagen_url} alt={c.nombre} fill className="object-cover" sizes="40px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</p>
                <p className="text-xs text-zinc-500">/{c.slug} · {c.productos_count} productos</p>
              </div>
              <Badge variant={c.activa ? 'success' : 'default'}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <button onClick={() => startEdit(c)} className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button onClick={() => handleEliminar(c.id, c.nombre)} disabled={isPending} className="flex items-center gap-1 text-sm font-medium text-red-500 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </div>
        ))}
        {categorias.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            No hay categorías
          </div>
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="px-4 py-3">Imagen</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-center">Orden</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {categorias.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {c.imagen_url && (
                        <Image src={c.imagen_url} alt={c.nombre} fill className="object-cover" sizes="40px" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</td>
                  <td className="px-4 py-3 text-zinc-500">/{c.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default">{c.productos_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500">{c.orden}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.activa ? 'success' : 'default'}>
                      {c.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(c)} className="text-indigo-600 hover:text-indigo-800" aria-label={`Editar ${c.nombre}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEliminar(c.id, c.nombre)} disabled={isPending} className="text-red-400 hover:text-red-600 disabled:opacity-50" aria-label={`Eliminar ${c.nombre}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No hay categorías
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
