'use client'

import { useState, useTransition } from 'react'
import { crearProveedor, actualizarProveedor, eliminarProveedor } from '@/lib/actions/admin'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react'
import type { Proveedor } from '@/types'

type ProveedorConConteo = Proveedor & { productos_count: number }

interface ProveedoresManagerProps {
  proveedores: ProveedorConConteo[]
}

export function ProveedoresManager({ proveedores }: ProveedoresManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [urlTienda, setUrlTienda] = useState('')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const resetForm = () => {
    setNombre('')
    setContacto('')
    setEmail('')
    setWhatsapp('')
    setUrlTienda('')
    setNotas('')
    setEditingId(null)
    setError('')
  }

  const startEdit = (p: ProveedorConConteo) => {
    setNombre(p.nombre)
    setContacto(p.contacto || '')
    setEmail(p.email || '')
    setWhatsapp(p.whatsapp || '')
    setUrlTienda(p.url_tienda || '')
    setNotas(p.notas || '')
    setEditingId(p.id)
    setShowForm(true)
    setError('')
  }

  const handleSave = () => {
    if (!nombre.trim()) return setError('Nombre es requerido')
    setError('')

    const fd = new FormData()
    fd.set('nombre', nombre.trim())
    fd.set('contacto', contacto)
    fd.set('email', email)
    fd.set('whatsapp', whatsapp)
    fd.set('url_tienda', urlTienda)
    fd.set('notas', notas)

    startTransition(async () => {
      const result = editingId
        ? await actualizarProveedor(editingId, fd)
        : await crearProveedor(fd)

      if (result.ok) {
        resetForm()
        setShowForm(false)
      } else {
        setError(result.error || 'Error al guardar')
      }
    })
  }

  const handleEliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el proveedor "${nombre}"?`)) return
    startTransition(async () => {
      const result = await eliminarProveedor(id)
      if (result.error) alert(result.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">Proveedores</h1>
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
          {showForm ? 'Cerrar' : 'Nuevo proveedor'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400" role="alert">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" value={nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)} required />
            <Input label="Contacto" value={contacto} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContacto(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
            <Input label="WhatsApp" value={whatsapp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsapp(e.target.value)} placeholder="3001234567" />
            <Input label="URL tienda" value={urlTienda} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlTienda(e.target.value)} placeholder="https://..." />
            <Input label="Notas" value={notas} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotas(e.target.value)} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleSave} loading={isPending}>Guardar</Button>
            <Button variant="ghost" onClick={() => { resetForm(); setShowForm(false) }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {proveedores.map((p) => (
          <div key={p.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{p.nombre}</h3>
              <Badge variant="default">{p.productos_count} productos</Badge>
            </div>
            <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {p.contacto && <p>Contacto: {p.contacto}</p>}
              {p.email && (
                <p>
                  Email:{' '}
                  <a href={`mailto:${p.email}`} className="text-indigo-600 hover:underline">
                    {p.email}
                  </a>
                </p>
              )}
              {p.whatsapp && (
                <p>
                  WhatsApp:{' '}
                  <a
                    href={`https://wa.me/57${p.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {p.whatsapp}
                  </a>
                </p>
              )}
              {p.url_tienda && (
                <p>
                  <a
                    href={p.url_tienda}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    Tienda <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
              {p.notas && <p className="mt-2 text-xs text-zinc-500">{p.notas}</p>}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <button
                onClick={() => startEdit(p)}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                onClick={() => handleEliminar(p.id, p.nombre)}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </div>
        ))}
        {proveedores.length === 0 && (
          <div className="col-span-2 py-12 text-center text-zinc-500">
            No hay proveedores
          </div>
        )}
      </div>
    </>
  )
}
