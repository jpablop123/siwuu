'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

/**
 * La marca es clara por defecto (dirección "Aduana sobre blanco"): el catálogo
 * son renders oficiales de Apple y Samsung sobre fondo blanco, así que el modo
 * claro es el que hace que el producto se vea como en la tienda oficial.
 * El modo oscuro sigue disponible para quien lo prefiera.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('siwuu-theme') as Theme | null
    const resolved: Theme = stored === 'dark' ? 'dark' : 'light'
    if (!stored) localStorage.setItem('siwuu-theme', 'light')
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('siwuu-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
