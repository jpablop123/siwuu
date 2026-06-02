'use client'

/**
 * PhoneInput — input internacional con selector de país + validación por dígitos.
 *
 * Comportamiento:
 *   - Selector de país a la izquierda (con bandera + código)
 *   - Input numérico a la derecha (solo dígitos, maxLength por país)
 *   - Validación en blur: cantidad exacta de dígitos del país seleccionado
 *   - Devuelve el valor completo "+57 3001234567" al onChange
 *
 * Almacenamiento:
 *   El parent recibe el valor formateado completo (con código). Cuando se
 *   monta y le pasamos un value ya guardado (ej. de profile), lo parseamos
 *   con `parsePhone()` y separamos en país + número.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COUNTRIES,
  maxDigits,
  isValidDigits,
  formatPhone,
  parsePhone,
  type CountryPhone,
} from '@/lib/intl/phones'

interface PhoneInputProps {
  /** Valor completo "+57 3001234567" */
  value: string
  onChange: (formatted: string) => void
  label?: string
  /** name del hidden input para FormData */
  name?: string
  required?: boolean
  error?: string
  /** ID externo opcional */
  id?: string
  /** Hint debajo */
  hint?: string
  /** Si true, no se puede editar */
  readOnly?: boolean
}

export function PhoneInput({
  value,
  onChange,
  label,
  name,
  required,
  error,
  id,
  hint,
  readOnly,
}: PhoneInputProps) {
  // Parseamos el value inicial. Si está vacío, default Colombia.
  const initial = useMemo(() => parsePhone(value), [])  // eslint-disable-line react-hooks/exhaustive-deps

  const [country, setCountry] = useState<CountryPhone>(initial.country)
  const [numero, setNumero] = useState<string>(initial.numero)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [touched, setTouched] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const numeroRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Propagar al parent cada cambio
  useEffect(() => {
    if (!numero) {
      onChange('')
      return
    }
    onChange(formatPhone(country, numero))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, numero])

  // Si el value externo cambia (ej. reset de form), re-sincronizar
  useEffect(() => {
    const parsed = parsePhone(value)
    if (parsed.country.iso !== country.iso) setCountry(parsed.country)
    if (parsed.numero !== numero) setNumero(parsed.numero)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Click fuera cierra el dropdown
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus búsqueda al abrir
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
    else setQuery('')
  }, [open])

  // Filtrado de países
  const filtered = useMemo(() => {
    if (!query) return COUNTRIES
    const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return COUNTRIES.filter(
      (c) =>
        c.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q) ||
        c.code.includes(query.replace(/\D/g, '')) ||
        c.iso.toLowerCase().includes(q),
    )
  }, [query])

  const seleccionarPais = (c: CountryPhone) => {
    setCountry(c)
    setOpen(false)
    // Si los dígitos sobran del nuevo país, recortamos
    const max = maxDigits(c)
    if (numero.length > max) setNumero(numero.slice(0, max))
    setTimeout(() => numeroRef.current?.focus(), 50)
  }

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo dígitos
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, maxDigits(country))
    setNumero(onlyDigits)
  }

  // Validación local que se muestra en blur
  const localError = touched && numero && !isValidDigits(country, numero)
    ? `Debe tener ${
        typeof country.digits === 'number'
          ? country.digits
          : country.digits.join(' o ')
      } dígitos para ${country.nombre}`
    : null

  const displayError = error || localError
  const expectedDigits = typeof country.digits === 'number' ? country.digits : country.digits[0]

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && (
        <label
          htmlFor={id ?? `${name}-input`}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative flex w-full rounded-xl border-2 bg-zinc-50 transition-colors focus-within:ring-1 dark:bg-zinc-900',
          displayError
            ? 'border-rose-500/50 focus-within:border-rose-500/50 focus-within:ring-rose-500/20'
            : 'border-zinc-200 focus-within:border-emerald-500/50 focus-within:ring-emerald-500/20 dark:border-zinc-700',
          readOnly && 'opacity-70',
        )}
      >
        {/* Trigger país */}
        <button
          type="button"
          onClick={() => !readOnly && setOpen((o) => !o)}
          disabled={readOnly}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-l-[10px] border-r border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700',
            !readOnly && 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
            readOnly && 'cursor-not-allowed',
          )}
          aria-label="Cambiar país"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="text-lg leading-none" aria-hidden="true">{country.flag}</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">+{country.code}</span>
          {!readOnly && (
            <ChevronDown
              className={cn('h-3.5 w-3.5 text-zinc-500 transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Input numérico */}
        <input
          ref={numeroRef}
          id={id ?? `${name}-input`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={numero}
          onChange={handleNumeroChange}
          onBlur={() => setTouched(true)}
          placeholder={country.ejemplo}
          maxLength={maxDigits(country)}
          required={required}
          readOnly={readOnly}
          aria-invalid={displayError ? true : undefined}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </div>

      {/* Hidden para FormData */}
      {name && (
        <input type="hidden" name={name} value={numero ? formatPhone(country, numero) : ''} required={required} />
      )}

      {displayError ? (
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400" role="alert">{displayError}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : (
        <p className="mt-1 text-xs text-zinc-500">{expectedDigits} dígitos · ej: {country.ejemplo}</p>
      )}

      {/* Panel selector de país */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40">
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
                const isSelected = c.iso === country.iso
                return (
                  <li
                    key={c.iso}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => seleccionarPais(c)}
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
