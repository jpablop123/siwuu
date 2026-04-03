'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Currency = 'COP' | 'USD'

const FALLBACK_RATE = 4200

interface CurrencyState {
  currency: Currency
  /** COP por 1 USD (con margen incluido) */
  rate: number
  rateUpdatedAt: string | null
  setCurrency: (c: Currency) => void
  fetchRate: () => Promise<void>
  format: (copAmount: number) => string
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'COP',
      rate: FALLBACK_RATE,
      rateUpdatedAt: null,

      setCurrency: (currency) => set({ currency }),

      fetchRate: async () => {
        try {
          const res = await fetch('/api/exchange-rate')
          if (!res.ok) return
          const data = await res.json()
          if (data.effectiveRate && typeof data.effectiveRate === 'number') {
            set({ rate: data.effectiveRate, rateUpdatedAt: data.cachedAt })
          }
        } catch {
          // Mantener la tasa cacheada o fallback
        }
      },

      format: (copAmount) => {
        const { currency, rate } = get()
        if (currency === 'USD') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(copAmount / rate)
        }
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(copAmount)
      },
    }),
    {
      name: 'dropshop-currency',
      // Solo persistir currency y rate, no funciones
      partialize: (state) => ({
        currency: state.currency,
        rate: state.rate,
        rateUpdatedAt: state.rateUpdatedAt,
      }),
    }
  )
)
