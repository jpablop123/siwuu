'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BuscadorComando } from './BuscadorComando'

interface ValorBuscador {
  abrir: (inicial?: string) => void
}

const Contexto = createContext<ValorBuscador | null>(null)

export function useBuscador(): ValorBuscador {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useBuscador tiene que usarse dentro de <BusquedaProvider>')
  return valor
}

/** No robar la tecla "/" cuando la persona está escribiendo en otro campo. */
function escribiendoEnCampo(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false
  return destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName)
}

/**
 * Un solo buscador para toda la tienda.
 *
 * Lo abren la barra del header, el tab "Buscar" de la barra inferior, Cmd/Ctrl+K
 * y la tecla "/". Vive una sola vez en el layout para que abrirlo desde
 * cualquier parte sea instantáneo y conserve las búsquedas en caché.
 */
export function BusquedaProvider({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [inicial, setInicial] = useState('')

  const abrir = useCallback((q = '') => {
    setInicial(q)
    setAbierto(true)
  }, [])

  const cerrar = useCallback(() => setAbierto(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setInicial('')
        setAbierto((v) => !v)
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !escribiendoEnCampo(e.target)) {
        e.preventDefault()
        setInicial('')
        setAbierto(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // El botón atrás del navegador cierra el buscador.
  //
  // No se cierra en cada cambio de ruta: si alguien toca un resultado y, en 4G,
  // vuelve a abrir el buscador antes de que termine de cargar la ficha, al
  // llegar la navegación se le cerraba en la cara. Todo lo que navega desde
  // adentro del buscador ya lo cierra por su cuenta.
  useEffect(() => {
    if (!abierto) return
    const onPopState = () => setAbierto(false)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [abierto])

  const valor = useMemo(() => ({ abrir }), [abrir])

  return (
    <Contexto.Provider value={valor}>
      {children}
      {abierto && <BuscadorComando inicial={inicial} onCerrar={cerrar} />}
    </Contexto.Provider>
  )
}
