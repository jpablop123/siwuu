'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Minus, Plus, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/lib/cart/store'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { Price } from '@/components/store/Price'
import type { Producto, Variante } from '@/types'

interface AddToCartFormProps {
  producto: Producto
  variantes: Variante[]
}

export function AddToCartForm({ producto, variantes }: AddToCartFormProps) {
  const [cantidad, setCantidad] = useState(1)
  const [seleccionadas, setSeleccionadas] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)
  const { agregarItem } = useCart()
  const addToast = useToast((s) => s.addToast)
  const router = useRouter()

  // Agrupar variantes por nombre (Color, Talla, etc.)
  const grupos = useMemo(() => {
    const map: Record<string, Variante[]> = {}
    variantes.forEach((v) => {
      if (!map[v.nombre]) map[v.nombre] = []
      map[v.nombre].push(v)
    })
    return map
  }, [variantes])

  const nombresGrupos = Object.keys(grupos)
  const todasSeleccionadas =
    nombresGrupos.length === 0 || nombresGrupos.every((g) => seleccionadas[g])

  // Calcular precio con variantes seleccionadas
  const precioCalculado = useMemo(() => {
    let precio = producto.precio_venta
    for (const [nombre, valor] of Object.entries(seleccionadas)) {
      const variante = grupos[nombre]?.find((v) => v.valor === valor)
      if (variante?.precio_adicional) {
        precio += variante.precio_adicional
      }
    }
    return precio
  }, [producto.precio_venta, seleccionadas, grupos])

  const handleSeleccionarVariante = (nombre: string, valor: string) => {
    setSeleccionadas((prev) => ({ ...prev, [nombre]: valor }))
  }

  const buildItem = () => {
    const varianteTexto = Object.entries(seleccionadas)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      precio: precioCalculado,
      imagen: producto.imagenes[0] || '',
      variante: varianteTexto || undefined,
      cantidad,
    }
  }

  const handleAgregar = () => {
    if (!todasSeleccionadas) {
      addToast('Selecciona todas las opciones', 'error')
      return
    }
    agregarItem(buildItem())
    setAdded(true)
    addToast('Producto agregado al carrito')
    setTimeout(() => setAdded(false), 2000)
  }

  const handleComprarAhora = () => {
    if (!todasSeleccionadas) {
      addToast('Selecciona todas las opciones', 'error')
      return
    }
    agregarItem(buildItem())
    router.push('/checkout')
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Selector de variantes */}
      {nombresGrupos.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grupos).map(([nombre, opciones]) => (
            <fieldset key={nombre}>
              <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {nombre}
                {seleccionadas[nombre] && (
                  <span className="ml-1 text-zinc-900 dark:text-zinc-100">: {seleccionadas[nombre]}</span>
                )}
              </legend>
              <div className="flex flex-wrap gap-2">
                {opciones.map((opcion) => {
                  const isSelected = seleccionadas[nombre] === opcion.valor
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => handleSeleccionarVariante(nombre, opcion.valor)}
                      disabled={!opcion.disponible}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                        !opcion.disponible && 'cursor-not-allowed opacity-40 line-through'
                      )}
                      aria-pressed={isSelected}
                    >
                      {opcion.valor}
                      {opcion.precio_adicional > 0 && (
                        <span className="ml-1 text-xs text-zinc-500">
                          (+<Price amount={opcion.precio_adicional} />)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {/* Precio calculado en tiempo real */}
      {nombresGrupos.length > 0 && Object.keys(seleccionadas).length > 0 && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Precio con opciones seleccionadas:{' '}
            <Price amount={precioCalculado} className="text-lg font-bold text-zinc-900 dark:text-zinc-100" />
          </p>
        </div>
      )}

      {/* Selector de cantidad + botones */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              className="rounded-l-xl px-3 py-2.5 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Reducir cantidad"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[3ch] select-none text-center text-sm font-semibold">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad(cantidad + 1)}
              className="rounded-r-xl px-3 py-2.5 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <Button
            onClick={handleAgregar}
            size="lg"
            variant="outline"
            className={cn('flex-1', added && 'border-green-500 text-green-500')}
            disabled={added}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" aria-hidden="true" />
                Agregado!
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                Agregar al carrito
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={handleComprarAhora}
          size="lg"
          className="w-full"
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Comprar ahora
        </Button>
      </div>
    </div>
  )
}
