'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, LayoutGrid, Package, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import { MIN_CARACTERES, normalizar } from '@/lib/busqueda'
import { useBusqueda } from './useBusqueda'
import { borrarRecientes, guardarReciente, leerRecientes } from './recientes'

type Item =
  | { tipo: 'reciente'; clave: string; href: string; termino: string }
  | { tipo: 'categoria'; clave: string; href: string; nombre: string }
  | { tipo: 'producto'; clave: string; href: string; nombre: string; precio: number; imagen: string | null; categoria: string | null }
  | { tipo: 'todos'; clave: string; href: string; total: number }

/** Pone en negrita la parte del texto que coincide con lo buscado, sin importar tildes. */
function Resaltado({ texto, termino }: { texto: string; termino: string }) {
  const t = normalizar(termino.trim())
  const i = t ? normalizar(texto).indexOf(t) : -1
  if (i < 0) return <>{texto}</>
  return (
    <>
      {texto.slice(0, i)}
      <mark className="bg-transparent font-bold text-ink-900 dark:text-white">{texto.slice(i, i + t.length)}</mark>
      {texto.slice(i + t.length)}
    </>
  )
}

interface Props {
  inicial: string
  onCerrar: () => void
}

/**
 * El buscador: pantalla completa en móvil, paleta centrada en desktop.
 *
 * Resultados mientras se escribe, navegación completa con teclado (↑ ↓ Enter
 * Esc), búsquedas recientes cuando está vacío, y un camino útil cuando no hay
 * resultados: si no está en el catálogo, se puede pedir de Estados Unidos.
 */
export function BuscadorComando({ inicial, onCerrar }: Props) {
  const router = useRouter()
  const idLista = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)

  const [q, setQ] = useState(inicial)
  const [activo, setActivo] = useState(0)
  // Solo se monta en el cliente, después de un toque: leer localStorage al
  // iniciar evita que las recientes aparezcan un instante después.
  const [recientes, setRecientes] = useState<string[]>(() => leerRecientes())
  const { datos, cargando, error } = useBusqueda(q)

  const termino = q.trim()
  const buscando = termino.length >= MIN_CARACTERES

  useEffect(() => {
    inputRef.current?.focus()

    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  const items = useMemo<Item[]>(() => {
    if (!buscando) {
      return recientes.map((r) => ({
        tipo: 'reciente' as const,
        clave: `r-${r}`,
        href: `/productos?q=${encodeURIComponent(r)}`,
        termino: r,
      }))
    }
    if (!datos) return []
    const lista: Item[] = [
      ...datos.categorias.map((c) => ({
        tipo: 'categoria' as const,
        clave: `c-${c.slug}`,
        href: `/categoria/${c.slug}`,
        nombre: c.nombre,
      })),
      ...datos.productos.map((p) => ({
        tipo: 'producto' as const,
        clave: `p-${p.id}`,
        href: `/productos/${p.slug}`,
        nombre: p.nombre,
        precio: p.precio,
        imagen: p.imagen,
        categoria: p.categoria,
      })),
    ]
    if (datos.total > 0) {
      lista.push({
        tipo: 'todos',
        clave: 'todos',
        href: `/productos?q=${encodeURIComponent(datos.q)}`,
        total: datos.total,
      })
    }
    return lista
  }, [buscando, recientes, datos])

  // Cada lista nueva arranca desde el primer resultado.
  useEffect(() => {
    setActivo(0)
  }, [items])

  // El resultado resaltado se precarga: si la persona le da Enter, la ficha ya viene en camino.
  const itemActivo = items[activo]
  useEffect(() => {
    if (itemActivo?.tipo === 'producto') router.prefetch(itemActivo.href)
  }, [itemActivo, router])

  // Mantener visible el resultado activo al moverse con el teclado.
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  const ir = (href: string, terminoAGuardar?: string) => {
    if (terminoAGuardar) guardarReciente(terminoAGuardar)
    onCerrar()
    router.push(href)
  }

  const abrirItem = (item: Item) => {
    if (item.tipo === 'reciente') ir(item.href, item.termino)
    else ir(item.href, termino)
  }

  const buscarTodo = () => {
    if (!buscando) return
    ir(`/productos?q=${encodeURIComponent(termino)}`, termino)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (items.length) setActivo((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (items.length) setActivo((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (itemActivo) abrirItem(itemActivo)
      else buscarTodo()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCerrar()
    }
  }

  const sinResultados = buscando && datos && !cargando && datos.productos.length === 0 && datos.categorias.length === 0
  const idOpcion = (i: number) => `${idLista}-opcion-${i}`

  const filaBase = (i: number) =>
    cn(
      'flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors duration-75 sm:min-h-12 sm:py-1.5',
      i === activo ? 'bg-brand-50 dark:bg-brand-500/15' : 'hover:bg-ink-50 dark:hover:bg-ink-800/60',
    )

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Buscar productos">
      <button
        type="button"
        onClick={onCerrar}
        tabIndex={-1}
        aria-label="Cerrar buscador"
        className="absolute inset-0 hidden h-full w-full bg-ink-950/40 sm:block"
      />

      <div className="relative flex h-full flex-col bg-white sm:mx-auto sm:mt-[10vh] sm:h-auto sm:max-h-[72vh] sm:w-full sm:max-w-xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-ink-200 sm:shadow-[0_24px_64px_-24px_rgb(22_28_36_/_0.35)] dark:bg-ink-900 sm:dark:border-ink-700">
        {/* Campo */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (itemActivo) abrirItem(itemActivo)
            else buscarTodo()
          }}
          className="flex items-center gap-1 border-b border-ink-200 px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] sm:px-3 sm:pt-2 dark:border-ink-800"
        >
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Volver"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50 sm:hidden dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <Search className="ml-1 hidden h-5 w-5 shrink-0 text-ink-400 sm:block" aria-hidden="true" />

          <input
            ref={inputRef}
            id="buscador-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar iPhone, Mac, cargadores…"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={idLista}
            aria-activedescendant={itemActivo ? idOpcion(activo) : undefined}
            aria-autocomplete="list"
            className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-white [&::-webkit-search-cancel-button]:hidden"
          />

          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                inputRef.current?.focus()
              }}
              aria-label="Borrar búsqueda"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-ink-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <kbd className="mr-1 hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 sm:inline dark:border-ink-700">
            Esc
          </kbd>
        </form>

        {/* Resultados */}
        <div className={cn('flex-1 overflow-y-auto overscroll-contain', cargando && datos && 'opacity-60')}>
          {!buscando && recientes.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-500 dark:text-ink-400">
              Busca por producto o marca: iPhone 17, MacBook Air, cargador USB-C…
            </p>
          )}

          {!buscando && recientes.length > 0 && (
            <div className="flex items-center justify-between px-4 pb-1 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Búsquedas recientes
              </p>
              <button
                type="button"
                onClick={() => {
                  borrarRecientes()
                  setRecientes([])
                  inputRef.current?.focus()
                }}
                className="h-9 px-1 text-xs font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white"
              >
                Borrar
              </button>
            </div>
          )}

          {error && buscando && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-ink-700 dark:text-ink-200">No pudimos buscar. Revisa tu conexión.</p>
              <button
                type="button"
                onClick={buscarTodo}
                className="mt-3 h-11 rounded-lg border border-ink-200 px-4 text-sm font-semibold text-ink-900 hover:border-brand-500 dark:border-ink-700 dark:text-white"
              >
                Ver resultados igual
              </button>
            </div>
          )}

          {sinResultados && (
            <div className="px-4 py-8 text-center">
              <p className="font-heading text-base font-bold text-ink-900 dark:text-white">
                No encontramos “{termino}” en el catálogo
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500 dark:text-ink-400">
                Si lo venden en una tienda de Estados Unidos, te lo podemos traer.
              </p>
              <button
                type="button"
                onClick={() => ir('/pedido-usa', termino)}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                Pídelo de USA
              </button>
            </div>
          )}

          {items.length > 0 && (
            <ul ref={listaRef} id={idLista} role="listbox" aria-label="Resultados" className="py-1">
              {items.map((item, i) => (
                <li
                  key={item.clave}
                  id={idOpcion(i)}
                  role="option"
                  aria-selected={i === activo}
                  data-indice={i}
                  onMouseMove={() => setActivo(i)}
                  onClick={() => abrirItem(item)}
                  className={filaBase(i)}
                >
                  {item.tipo === 'reciente' && (
                    <>
                      <Clock className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-800 dark:text-ink-100">{item.termino}</span>
                    </>
                  )}

                  {item.tipo === 'categoria' && (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-ink-800 dark:text-ink-100">
                        Categoría: <Resaltado texto={item.nombre} termino={termino} />
                      </span>
                    </>
                  )}

                  {item.tipo === 'producto' && (
                    <>
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-ink-700">
                        {item.imagen ? (
                          <Image src={item.imagen} alt="" fill sizes="48px" className="object-contain p-1" />
                        ) : (
                          <Package className="m-auto h-5 w-5 text-ink-300" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-sm text-ink-700 dark:text-ink-200">
                          <Resaltado texto={item.nombre} termino={termino} />
                        </span>
                        {item.categoria && (
                          <span className="block text-xs text-ink-500 dark:text-ink-400">{item.categoria}</span>
                        )}
                      </span>
                      <Price
                        amount={item.precio}
                        className="shrink-0 font-heading text-sm font-extrabold tabular-nums text-ink-900 dark:text-white"
                      />
                    </>
                  )}

                  {item.tipo === 'todos' && (
                    <>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
                        Ver {item.total === 1 ? 'el resultado' : `los ${item.total} resultados`} para “{termino}”
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Atajos — solo con teclado físico */}
        <div className="hidden items-center gap-4 border-t border-ink-200 px-4 py-2 text-[11px] text-ink-400 sm:flex dark:border-ink-800">
          <span><kbd className="font-mono">↑ ↓</kbd> moverse</span>
          <span><kbd className="font-mono">Enter</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
