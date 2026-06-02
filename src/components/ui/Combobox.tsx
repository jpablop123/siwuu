'use client'

/**
 * Combobox — dropdown estilizado con búsqueda integrada.
 *
 * Sustituto del `<select>` nativo cuando la lista de opciones es larga
 * (departamentos, ciudades) o necesitamos un diseño consistente con el
 * resto del UI (no quedamos a merced del select nativo del OS).
 *
 * Features:
 *   - Búsqueda con filtrado en vivo (case-insensitive, normaliza acentos)
 *   - Teclado: ↑/↓ navega, Enter selecciona, Esc cierra
 *   - Click outside cierra el panel
 *   - Estado disabled
 *   - Bi-modal (light/dark)
 *   - ARIA combobox pattern (W3C)
 */

import { useEffect, useRef, useState, useMemo, useCallback, useId } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  label?: string
  /** Lista de opciones. Strings simples — value === label */
  options: readonly string[]
  /** Valor actual */
  value: string
  /** Callback al cambiar */
  onChange: (value: string) => void
  /** Placeholder mostrado cuando value es vacío */
  placeholder?: string
  /** Placeholder del input de búsqueda dentro del panel */
  searchPlaceholder?: string
  /** Mensaje cuando no hay coincidencias en la búsqueda */
  emptyMessage?: string
  /** Mensaje cuando el componente está disabled */
  disabledMessage?: string
  disabled?: boolean
  required?: boolean
  /** name del input hidden — para submit con FormData */
  name?: string
  /** Error a mostrar debajo */
  error?: string
  /** Hint debajo del campo */
  hint?: string
  /** ID externo (sino se genera) */
  id?: string
}

// Normaliza para búsqueda: lowercase + quita acentos
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccioná...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  disabledMessage,
  disabled = false,
  required = false,
  name,
  error,
  hint,
  id: externalId,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const optionsListRef = useRef<HTMLUListElement>(null)

  const generatedId = useId()
  const id = externalId ?? generatedId

  // Filtrado de opciones
  const filtered = useMemo(() => {
    if (!query) return options
    const q = normalize(query)
    return options.filter((opt) => normalize(opt).includes(q))
  }, [options, query])

  // ── Cerrar al hacer click afuera ──────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Focus en search input al abrir ────────────────────────────
  useEffect(() => {
    if (open) {
      // Resetear búsqueda y posicionar highlight en el seleccionado
      setQuery('')
      const idx = options.findIndex((o) => o === value)
      setHighlighted(idx >= 0 ? idx : 0)
      // Pequeño delay para que la animación termine
      setTimeout(() => searchInputRef.current?.focus(), 30)
    }
  }, [open, options, value])

  // ── Scroll del highlighted al view ─────────────────────────────
  useEffect(() => {
    if (!open) return
    const el = optionsListRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const seleccionar = useCallback(
    (opt: string) => {
      onChange(opt)
      setOpen(false)
      setQuery('')
      triggerRef.current?.focus()
    },
    [onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(filtered.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlighted]
      if (opt) seleccionar(opt)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setHighlighted(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setHighlighted(filtered.length - 1)
    }
  }

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger button — emula el estilo del Input */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-1',
          disabled
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-600'
            : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600',
          error && 'border-rose-500/50 focus-visible:border-rose-500/50 focus-visible:ring-rose-500/20',
          open && 'border-emerald-500/50 ring-1 ring-emerald-500/20',
        )}
      >
        <span className={cn('truncate', !value && 'text-zinc-400 dark:text-zinc-500')}>
          {value || (disabled && disabledMessage ? disabledMessage : placeholder)}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-zinc-500 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Hidden input para que FormData lo recoja en submits */}
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}

      {/* Error / hint */}
      {error && (
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}

      {/* Panel desplegable */}
      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
          onKeyDown={handleKeyDown}
        >
          {/* Search */}
          <div className="relative border-b border-zinc-200 dark:border-zinc-700">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlighted(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="w-full bg-transparent px-9 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
              aria-label={searchPlaceholder}
              aria-controls={`${id}-listbox`}
              aria-activedescendant={
                filtered[highlighted] ? `${id}-opt-${highlighted}` : undefined
              }
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              {emptyMessage}
            </div>
          ) : (
            <ul
              ref={optionsListRef}
              id={`${id}-listbox`}
              role="listbox"
              className="max-h-72 overflow-y-auto py-1"
            >
              {filtered.map((opt, idx) => {
                const isSelected = opt === value
                const isHighlighted = idx === highlighted
                return (
                  <li
                    id={`${id}-opt-${idx}`}
                    key={opt}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => seleccionar(opt)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm transition-colors',
                      isHighlighted && !isSelected && 'bg-zinc-100 dark:bg-zinc-800',
                      isSelected && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
                      !isSelected && !isHighlighted && 'text-zinc-800 dark:text-zinc-200',
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {/* Footer con contador (solo si hay búsqueda activa) */}
          {query && filtered.length > 0 && (
            <div className="border-t border-zinc-200 px-4 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-700">
              {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

