'use client'

import { useEffect } from 'react'
import { useCurrency, type Currency } from '@/lib/currency/store'

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'COP', label: 'COP' },
  { value: 'USD', label: 'USD' },
]

export function CurrencyToggle() {
  const currency = useCurrency((s) => s.currency)
  const setCurrency = useCurrency((s) => s.setCurrency)
  const fetchRate = useCurrency((s) => s.fetchRate)

  // Consultar tasa actualizada al montar
  useEffect(() => {
    fetchRate()
  }, [fetchRate])

  return (
    <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-mono">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setCurrency(opt.value)}
          className={`px-2 py-1 transition-colors ${
            currency === opt.value
              ? 'bg-emerald-500 text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
