'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { urlCatalogo, type FiltrosCatalogo, type ModoCatalogo } from '@/lib/catalogo'
import type { Categoria } from '@/types'

interface ValorFiltros {
  /** Lo que el usuario acaba de pedir, aunque el servidor todavía no responda. */
  filtros: FiltrosCatalogo
  aplicar: (cambios: Partial<FiltrosCatalogo>) => void
  limpiar: () => void
  /** true mientras el servidor calcula los resultados nuevos. */
  pendiente: boolean
  total: number
  categorias: Categoria[]
  modo: ModoCatalogo
}

const Contexto = createContext<ValorFiltros | null>(null)

export function useFiltros(): ValorFiltros {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useFiltros tiene que usarse dentro de <FiltrosProvider>')
  return valor
}

interface Props {
  children: React.ReactNode
  /** Filtros ya parseados de la URL por el servidor. */
  filtros: FiltrosCatalogo
  modo: ModoCatalogo
  total: number
  categorias: Categoria[]
}

/**
 * Estado de filtros del catálogo.
 *
 * La URL es la fuente de verdad, pero esperar al servidor para marcar un filtro
 * se siente roto en 4G: el toque no responde durante uno o dos segundos. Por
 * eso cada cambio se refleja al instante en un estado optimista (chips,
 * categoría marcada, rango de precio), y la navegación corre dentro de una
 * transición que atenúa los resultados mientras llegan los nuevos.
 *
 * Se usa `push` y no `replace` para que el botón atrás deshaga el último filtro.
 */
export function FiltrosProvider({ children, filtros, modo, total, categorias }: Props) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [optimista, setOptimista] = useState<FiltrosCatalogo | null>(null)

  // Cuando llegan filtros nuevos del servidor, el optimista ya no hace falta.
  const clave = JSON.stringify(filtros)
  useEffect(() => {
    setOptimista(null)
  }, [clave])

  const actuales = optimista ?? filtros

  const navegar = useCallback(
    (siguientes: FiltrosCatalogo) => {
      setOptimista(siguientes)
      startTransition(() => {
        router.push(urlCatalogo(siguientes, modo), { scroll: false })
      })
    },
    [modo, router],
  )

  const aplicar = useCallback(
    (cambios: Partial<FiltrosCatalogo>) => {
      const siguientes: FiltrosCatalogo = { ...actuales, ...cambios }
      // Nada de claves vacías en la URL
      for (const k of Object.keys(siguientes) as (keyof FiltrosCatalogo)[]) {
        if (!siguientes[k]) delete siguientes[k]
      }
      navegar(siguientes)
    },
    [actuales, navegar],
  )

  const limpiar = useCallback(() => {
    // En una página de categoría, limpiar todo es volver al catálogo completo.
    navegar(actuales.q ? { q: actuales.q } : {})
  }, [actuales.q, navegar])

  const valor = useMemo<ValorFiltros>(
    () => ({ filtros: actuales, aplicar, limpiar, pendiente, total, categorias, modo }),
    [actuales, aplicar, limpiar, pendiente, total, categorias, modo],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
