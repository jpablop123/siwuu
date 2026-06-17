'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Check, UserPlus, UserCheck, Calendar, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCOP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  crearCupon,
  actualizarCupon,
  toggleCuponActivo,
  eliminarCupon,
} from '@/lib/actions/cupones'

interface CuponRow {
  id: string
  codigo: string
  tipo: 'porcentaje' | 'fijo'
  valor: number
  minimo_compra: number | null
  usos_maximos: number | null
  usos_actuales: number
  expira_en: string | null
  inicia_en: string | null
  descuento_maximo: number | null
  categoria_id: string | null
  solo_primera_compra: boolean
  un_uso_por_cliente: boolean
  activo: boolean
  created_at: string
}

interface CategoriaOption { id: string; nombre: string }

type Editor = { mode: 'crear' } | { mode: 'editar'; cupon: CuponRow } | null

export function CuponesManager({
  cuponesIniciales,
  categorias,
}: {
  cuponesIniciales: CuponRow[]
  categorias: CategoriaOption[]
}) {
  const router = useRouter()
  const [editor, setEditor] = useState<Editor>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, nuevoActivo: boolean) => {
    startTransition(async () => {
      await toggleCuponActivo(id, nuevoActivo)
      router.refresh()
    })
  }

  const handleEliminar = (id: string, codigo: string) => {
    if (!confirm(`¿Eliminar el cupón ${codigo}?`)) return
    startTransition(async () => {
      const r = await eliminarCupon(id)
      if (r.error) alert(r.error)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditor({ mode: 'crear' })}>
          <Plus className="h-4 w-4" />
          Nuevo cupón
        </Button>
      </div>

      {/* Tabla mobile-friendly */}
      {cuponesIniciales.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          No hay cupones todavía. Creá el primero arriba.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Descuento</th>
                <th className="px-4 py-3 text-left">Mín. compra</th>
                <th className="px-4 py-3 text-left">Usos</th>
                <th className="px-4 py-3 text-left">Expira</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {cuponesIniciales.map((c) => (
                <tr
                  key={c.id}
                  className={cn(
                    'transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
                    !c.activo && 'opacity-60',
                  )}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {c.codigo}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.tipo === 'porcentaje' ? `${c.valor}%` : formatCOP(c.valor)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {c.minimo_compra ? formatCOP(c.minimo_compra) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.usos_actuales}
                    {c.usos_maximos != null && (
                      <span className="text-zinc-500"> / {c.usos_maximos}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {c.expira_en
                      ? new Date(c.expira_en).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(c.id, !c.activo)}
                      disabled={isPending}
                      className={cn(
                        'inline-flex h-6 w-11 items-center rounded-full px-0.5 transition-colors disabled:opacity-50',
                        c.activo ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600',
                      )}
                      aria-label={c.activo ? 'Desactivar' : 'Activar'}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                          c.activo ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditor({ mode: 'editar', cupon: c })}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        aria-label={`Editar ${c.codigo}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id, c.codigo)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        aria-label={`Eliminar ${c.codigo}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <CuponEditor
          editor={editor}
          categorias={categorias}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// ── Modal de creación/edición ────────────────────────────────────────────────

function CuponEditor({
  editor,
  categorias,
  onClose,
  onSaved,
}: {
  editor: { mode: 'crear' } | { mode: 'editar'; cupon: CuponRow }
  categorias: CategoriaOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Valor inicial (datetime-local necesita 'YYYY-MM-DDTHH:mm')
  const initial = editor.mode === 'editar' ? editor.cupon : null
  const initialExpira = initial?.expira_en ? new Date(initial.expira_en).toISOString().slice(0, 16) : ''
  const initialInicia = initial?.inicia_en ? new Date(initial.inicia_en).toISOString().slice(0, 16) : ''

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result =
        editor.mode === 'crear'
          ? await crearCupon(formData)
          : await actualizarCupon(editor.cupon.id, formData)

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      } else if (result.error) {
        setGlobalError(result.error)
      } else if (result.ok) {
        onSaved()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:max-h-[calc(100dvh-3rem)]"
        noValidate
      >
        {/* Header sticky */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {editor.mode === 'crear' ? 'Nuevo cupón' : `Editar ${initial?.codigo}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {globalError && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" role="alert">
              {globalError}
            </div>
          )}

          <div className="space-y-4">
          <Input
            label="Código"
            name="codigo"
            required
            defaultValue={initial?.codigo ?? ''}
            placeholder="BLACKFRIDAY10"
            error={fieldErrors.codigo}
            hint={!fieldErrors.codigo ? 'Letras, números, guión y _ (se guarda en mayúsculas)' : undefined}
            maxLength={30}
            style={{ textTransform: 'uppercase' }}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipo de descuento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['porcentaje', 'fijo'] as const).map((t) => (
                <label
                  key={t}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors',
                    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                    'has-[input:checked]:border-emerald-500 has-[input:checked]:bg-emerald-50 has-[input:checked]:text-emerald-800 dark:has-[input:checked]:bg-emerald-500/10 dark:has-[input:checked]:text-emerald-300',
                  )}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={t}
                    defaultChecked={initial ? initial.tipo === t : t === 'porcentaje'}
                    className="sr-only"
                  />
                  {t === 'porcentaje' ? '% Porcentaje' : '$ Monto fijo'}
                </label>
              ))}
            </div>
            {fieldErrors.tipo && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-400" role="alert">{fieldErrors.tipo}</p>
            )}
          </div>

          <Input
            label="Valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initial?.valor ?? ''}
            placeholder="10 (para 10% o $10)"
            error={fieldErrors.valor}
          />

          <Input
            label="Compra mínima para aplicar (opcional)"
            name="minimo_compra"
            type="number"
            min="0"
            step="1000"
            defaultValue={initial?.minimo_compra ?? ''}
            placeholder="50000"
            error={fieldErrors.minimo_compra}
            hint={!fieldErrors.minimo_compra ? 'El carrito debe sumar al menos este valor. Ej: $50.000. Vacío = sin mínimo.' : undefined}
          />

          <Input
            label="Usos máximos en total (opcional)"
            name="usos_maximos"
            type="number"
            min="1"
            step="1"
            defaultValue={initial?.usos_maximos ?? ''}
            placeholder="100"
            error={fieldErrors.usos_maximos}
            hint={!fieldErrors.usos_maximos ? 'Cuántas veces se puede canjear en toda la tienda. Vacío = ilimitado.' : undefined}
          />

          <Input
            label="Tope de descuento (opcional)"
            name="descuento_maximo"
            type="number"
            min="0"
            step="1000"
            defaultValue={initial?.descuento_maximo ?? ''}
            placeholder="50000"
            error={fieldErrors.descuento_maximo}
            hint={!fieldErrors.descuento_maximo ? 'Lo máximo que se descuenta, aunque el % dé más. Ej: 30% pero máx $50.000.' : undefined}
          />

          {/* Vigencia */}
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vigencia (opcional)</p>
            </div>
            <p className="text-xs text-zinc-500">Define desde y hasta cuándo funciona. Si las dejas vacías, sirve de inmediato y sin vencimiento.</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Empieza"
                name="inicia_en"
                type="datetime-local"
                defaultValue={initialInicia}
                error={fieldErrors.inicia_en}
              />
              <Input
                label="Vence"
                name="expira_en"
                type="datetime-local"
                defaultValue={initialExpira}
                error={fieldErrors.expira_en}
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoria-select" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Aplica solo a una categoría (opcional)
            </label>
            <select
              id="categoria-select"
              name="categoria_id"
              defaultValue={initial?.categoria_id ?? ''}
              className="flex w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus-visible:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Cualquier categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              El cupón solo aplica si el carrito tiene productos de esa categoría. &quot;Cualquier categoría&quot; = sin restricción.
            </p>
            {fieldErrors.categoria_id && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-400" role="alert">{fieldErrors.categoria_id}</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">¿Quién puede usar este cupón?</p>
              <p className="text-xs text-zinc-500">
                Si no marcas nada, lo puede usar cualquier cliente, las veces que quiera.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-900">
              <input
                type="checkbox"
                name="solo_primera_compra"
                value="true"
                defaultChecked={initial?.solo_primera_compra ?? false}
                className="mt-0.5 h-4 w-4 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Solo clientes nuevos</span>
                <span className="block text-xs text-zinc-500">
                  Únicamente quien nunca ha tenido un pedido pagado. Ideal para dar la bienvenida.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-900">
              <input
                type="checkbox"
                name="un_uso_por_cliente"
                value="true"
                defaultChecked={initial?.un_uso_por_cliente ?? false}
                className="mt-0.5 h-4 w-4 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Una sola vez por cliente</span>
                <span className="block text-xs text-zinc-500">
                  Cada cliente (por email o cuenta) puede usarlo una única vez. Evita que se repita.
                </span>
              </span>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              name="activo"
              value="true"
              defaultChecked={initial ? initial.activo : true}
              className="h-4 w-4 rounded border-zinc-400 bg-white text-emerald-600 accent-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
            />
            Activo (visible para clientes)
          </label>
          </div>
        </div>

        {/* Footer sticky con los botones */}
        <div className="flex shrink-0 gap-3 border-t border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800/30">
          <Button type="submit" loading={isPending} className="flex-1">
            <Check className="h-4 w-4" />
            {editor.mode === 'crear' ? 'Crear cupón' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
