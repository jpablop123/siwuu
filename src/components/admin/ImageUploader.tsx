'use client'

/**
 * ImageUploader — gestor de imágenes de productos para el panel admin.
 *
 * Features:
 * - Drag & drop o clic para seleccionar (hasta 5 imágenes, JPG/PNG/WebP, máx 5MB)
 * - Progreso individual por archivo (pending → uploading → done | error)
 * - Reordenar arrastrando con los botones ← → (la primera = imagen principal)
 * - Eliminar imágenes ya subidas
 * - Llama a la Server Action subirImagen (service role → sin exponer secrets)
 */

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { subirImagen } from '@/lib/actions/admin'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FileEntry {
  /** key local para React (no enviado a BD) */
  key: string
  status: FileStatus
  /** URL pública una vez subida */
  url?: string
  /** Mensaje de error si falló */
  errorMsg?: string
  /** Nombre del archivo para mostrar en estado de error */
  nombre: string
}

interface ImageUploaderProps {
  /** URLs actuales del producto (iniciales en modo editar) */
  value: string[]
  /** Callback cuando cambia el array de URLs confirmadas */
  onChange: (urls: string[]) => void
  /** Máximo de imágenes permitidas */
  max?: number
}

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_SIZE_MB = 5

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageUploader({ value, onChange, max = 5 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  /** Entradas en proceso de subida (no confirmadas aún en `value`) */
  const [queue, setQueue] = useState<FileEntry[]>([])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const slotsLibres = max - value.length - queue.filter((f) => f.status !== 'error').length

  const updateQueue = useCallback(
    (key: string, patch: Partial<FileEntry>) =>
      setQueue((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f))),
    []
  )

  // ── Upload ─────────────────────────────────────────────────────────────────

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
        .filter((f) => f.type.match(/^image\/(jpeg|png|webp)$/))
        .slice(0, Math.max(0, slotsLibres))

      if (!fileArray.length) return

      // Crear entradas en estado pendiente para mostrar en UI inmediatamente
      const entries: FileEntry[] = fileArray.map((f) => ({
        key: `${Date.now()}-${Math.random()}`,
        status: 'pending',
        nombre: f.name,
      }))
      setQueue((prev) => [...prev, ...entries])

      // Subir en paralelo (max 3 a la vez para no saturar)
      const chunks: FileEntry[][] = []
      for (let i = 0; i < entries.length; i += 3) chunks.push(entries.slice(i, i + 3))

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (entry, idx) => {
            updateQueue(entry.key, { status: 'uploading' })

            if (fileArray[entries.indexOf(entry)].size > MAX_SIZE_MB * 1024 * 1024) {
              updateQueue(entry.key, {
                status: 'error',
                errorMsg: `Supera ${MAX_SIZE_MB}MB`,
              })
              return
            }

            const fd = new FormData()
            fd.set('file', fileArray[entries.indexOf(entry)])
            const result = await subirImagen(fd)

            if (result.ok && result.url) {
              updateQueue(entry.key, { status: 'done', url: result.url })
              // Confirmar URL al padre
              onChange([...value, result.url])
            } else {
              updateQueue(entry.key, {
                status: 'error',
                errorMsg: result.error ?? 'Error desconocido',
              })
            }
          })
        )
      }

      // Limpiar entradas finalizadas (done/error) del queue tras 2s
      setTimeout(() => {
        setQueue((prev) => prev.filter((f) => f.status === 'uploading'))
      }, 2000)
    },
    [slotsLibres, value, onChange, updateQueue]
  )

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  // ── Reorder & remove ──────────────────────────────────────────────────────

  const swap = (a: number, b: number) => {
    const next = [...value]
    ;[next[a], next[b]] = [next[b], next[a]]
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isUploading = queue.some((f) => f.status === 'uploading' || f.status === 'pending')

  return (
    <div className="space-y-4">
      {/* Drop zone — oculta cuando ya se alcanzó el máximo */}
      {value.length + queue.filter((f) => f.status !== 'error').length < max && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Subir imágenes (clic o arrastrar)"
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-sm transition-colors',
            isDragging
              ? 'border-emerald-400 bg-emerald-500/5 text-emerald-400'
              : 'border-zinc-200 text-zinc-500 hover:border-emerald-400 hover:text-emerald-400 dark:border-zinc-700'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          ) : (
            <Upload className="h-6 w-6" aria-hidden="true" />
          )}
          <span className="font-medium">
            {isUploading
              ? 'Subiendo...'
              : isDragging
                ? 'Soltá las imágenes aquí'
                : 'Arrastrá imágenes o hacé clic para seleccionar'}
          </span>
          <span className="text-xs text-zinc-400">
            JPG, PNG o WebP · Máx {MAX_SIZE_MB}MB · {slotsLibres} lugar{slotsLibres !== 1 ? 'es' : ''} disponible{slotsLibres !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files ?? [])
          e.target.value = ''        // reset para poder volver a elegir el mismo archivo
        }}
      />

      {/* Queue de subida en progreso/completadas/error */}
      {queue.length > 0 && (
        <ul className="space-y-2">
          {queue.map((entry) => (
            <li
              key={entry.key}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm',
                entry.status === 'error'
                  ? 'border-rose-500/30 bg-rose-500/5 text-rose-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
              )}
            >
              {entry.status === 'uploading' || entry.status === 'pending' ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-400" />
              ) : entry.status === 'done' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span className="min-w-0 truncate">{entry.nombre}</span>
              {entry.status === 'error' && (
                <span className="ml-auto shrink-0 text-xs">{entry.errorMsg}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Grid de imágenes confirmadas */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {value.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <Image
                src={url}
                alt={`Imagen ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />

              {/* Badge "Principal" en la primera */}
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                  Principal
                </span>
              )}

              {/* Controles: reordenar + eliminar */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => swap(i, i - 1)}
                    className="rounded-lg bg-zinc-200 p-1.5 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
                    aria-label="Mover a la izquierda"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                )}
                {i < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => swap(i, i + 1)}
                    className="rounded-lg bg-zinc-200 p-1.5 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
                    aria-label="Mover a la derecha"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg bg-rose-500 p-1.5 text-white hover:bg-rose-400"
                  aria-label="Eliminar imagen"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && queue.length === 0 && (
        <p className="text-center text-xs text-zinc-400">Aún no hay imágenes. La primera imagen será la principal en el catálogo.</p>
      )}

      <p className="text-xs text-zinc-500">
        {value.length}/{max} imágenes · La primera se muestra en el catálogo
      </p>
    </div>
  )
}
