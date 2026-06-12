'use client'

/**
 * CountrySelect — selector de país con búsqueda + bandera.
 *
 * Análogo a Combobox pero específico para países: muestra la bandera emoji
 * junto al nombre. Devuelve el ISO 3166-1 alpha-2 ("CO", "VE", "MX", ...).
 *
 * Pensado para usarse en forms donde el país de residencia es un dato
 * de primer nivel (no metido dentro del input de teléfono).
 */

import { useEffect, useMemo, useRef, useState, useId } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES, findByIso, type CountryPhone } from '@/lib/intl/phones'

interface CountrySelectProps {
  label?: string
  /** ISO 3166-1 alpha-2 — ej. "CO" */
  value: string
  onChange: (iso: string) => void
  required?: boolean
  /** name del hidden input para FormData (guarda el ISO, ej. "CO") */
  name?: string
  /** name del hidden input adicional para guardar el nombre legible (ej. "Colombia") */
  nameNombre?: string
  error?: string
  hint?: string
  id?: string
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function CountrySelect({
  label,
  value,
  onChange,
  required,
  name,
  nameNombre,
  error,
  hint,
  id: externalId,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const generatedId = useId()
  const id = externalId ?? generatedId

  const selected: CountryPhone = useMemo(
    () => findByIso(value) ?? COUNTRIES[0],
    [value],
  )

  const filtered = useMemo(() => {
    if (!query) return COUNTRIES
    const q = normalize(query)
    return COUNTRIES.filter(
      (c) =>
        normalize(c.nombre).includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.code.includes(query.replace(/\D/g, '')),
    )
  }, [query])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 30)
    }
  }, [open])

  const seleccionar = (c: CountryPhone) => {
    onChange(c.iso)
    setOpen(false)
    triggerRef.current?.focus()
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

      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={error ? true : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-1',
          error
            ? 'border-rose-500/50 focus-visible:border-rose-500/50 focus-visible:ring-rose-500/20'
            : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600',
          open && 'border-emerald-500/50 ring-1 ring-emerald-500/20',
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none" aria-hidden="true">{selected.flag}</span>
          <span className="truncate">{selected.nombre}</span>
          <span className="font-mono text-xs text-zinc-500">+{selected.code}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-zinc-500 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {/* Hidden inputs para FormData */}
      {name && <input type="hidden" name={name} value={selected.iso} required={required} />}
      {nameNombre && <input type="hidden" name={nameNombre} value={selected.nombre} />}

      {error && (
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
        >
          <div className="relative border-b border-zinc-200 dark:border-zinc-700">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país..."
              autoComplete="off"
              className="w-full bg-transparent px-9 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
              aria-label="Buscar país"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">Sin resultados</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
              {filtered.map((c) => {
                const isSelected = c.iso === selected.iso
                return (
                  <li
                    key={c.iso}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => seleccionar(c)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm transition-colors',
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none" aria-hidden="true">{c.flag}</span>
                      <span className="truncate">{c.nombre}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs text-zinc-500">+{c.code}</span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
