'use client'

import { useEffect, useState } from 'react'
import { MIN_CARACTERES, type RespuestaBusqueda } from '@/lib/busqueda'

/** Debounce corto: suficiente para no consultar en cada tecla, invisible al escribir. */
const ESPERA_MS = 150

/**
 * Caché de la sesión, fuera del componente: si la persona borra una letra y la
 * vuelve a escribir, o cierra y reabre el buscador, la respuesta es inmediata.
 */
const cache = new Map<string, RespuestaBusqueda>()

interface EstadoBusqueda {
  datos: RespuestaBusqueda | null
  cargando: boolean
  error: boolean
}

/**
 * Resultados instantáneos para un término.
 *
 * Mientras llega la respuesta nueva se siguen mostrando los resultados
 * anteriores (atenuados por quien los pinte) en vez de vaciar la lista: en 4G
 * una lista que parpadea en cada tecla se siente más lenta de lo que es.
 * Cada consulta nueva cancela la anterior, así una respuesta vieja nunca pisa
 * a una más reciente.
 */
export function useBusqueda(q: string): EstadoBusqueda {
  const [estado, setEstado] = useState<EstadoBusqueda>({ datos: null, cargando: false, error: false })

  useEffect(() => {
    const termino = q.trim()

    if (termino.length < MIN_CARACTERES) {
      setEstado({ datos: null, cargando: false, error: false })
      return
    }

    const clave = termino.toLowerCase()
    const guardada = cache.get(clave)
    if (guardada) {
      setEstado({ datos: guardada, cargando: false, error: false })
      return
    }

    setEstado((prev) => ({ ...prev, cargando: true, error: false }))

    const control = new AbortController()
    const temporizador = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(termino)}`, { signal: control.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const datos = (await res.json()) as RespuestaBusqueda
        cache.set(clave, datos)
        setEstado({ datos, cargando: false, error: false })
      } catch {
        if (!control.signal.aborted) setEstado((prev) => ({ ...prev, cargando: false, error: true }))
      }
    }, ESPERA_MS)

    return () => {
      clearTimeout(temporizador)
      control.abort()
    }
  }, [q])

  return estado
}
