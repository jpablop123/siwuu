'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

/**
 * Día / Noche.
 *
 * Va como control segmentado y no como un botón de un solo icono: la marca
 * tiene dos escenas diseñadas a propósito, así que la opción se muestra en vez
 * de esconderse detrás de un icono que hay que adivinar.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div
      className="flex items-center overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700"
      role="group"
      aria-label="Modo de visualización"
    >
      {([
        { value: 'light', label: 'Día', Icon: Sun },
        { value: 'dark', label: 'Noche', Icon: Moon },
      ] as const).map(({ value, label, Icon }) => {
        const activo = theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => { if (!activo) toggleTheme() }}
            aria-pressed={activo}
            title={`Modo ${label.toLowerCase()}`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
              activo
                ? 'bg-brand-500 text-white'
                : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
