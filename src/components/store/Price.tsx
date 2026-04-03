'use client'

import { useMemo } from 'react'
import { useCurrency } from '@/lib/currency/store'

interface PriceProps {
  amount: number
  className?: string
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function Price({ amount, className }: PriceProps) {
  const currency = useCurrency((s) => s.currency)
  const rate = useCurrency((s) => s.rate)

  const formatted = useMemo(() => {
    if (currency === 'USD') {
      return usdFormatter.format(amount / rate)
    }
    return copFormatter.format(amount)
  }, [amount, currency, rate])

  return <span className={className}>{formatted}</span>
}
