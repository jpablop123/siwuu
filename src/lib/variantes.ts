import type { Variante } from '@/types'

/**
 * Lógica de variantes, compartida entre la ficha y el selector rápido del
 * catálogo.
 *
 * Importa que sea una sola: el precio de un iPhone cambia $710.000 según el
 * almacenamiento, y el pedido no se puede comprar en Estados Unidos si no dice
 * el color. Si cada pantalla calculara lo suyo, tarde o temprano una vendería
 * al precio equivocado.
 */

export type GruposVariantes = Record<string, Variante[]>

/** Agrupa por nombre de opción: { Color: [...], Almacenamiento: [...] } */
export function agruparVariantes(variantes: Variante[]): GruposVariantes {
  const grupos: GruposVariantes = {}
  for (const v of variantes) {
    if (!grupos[v.nombre]) grupos[v.nombre] = []
    grupos[v.nombre].push(v)
  }
  return grupos
}

/**
 * Preselección: la primera opción disponible de cada grupo, que es la que no
 * tiene recargo. Así el precio del selector arranca igual al de la tarjeta y
 * nadie ve el precio subir sin haber tocado nada.
 */
export function seleccionInicial(grupos: GruposVariantes): Record<string, string> {
  const inicial: Record<string, string> = {}
  for (const [nombre, opciones] of Object.entries(grupos)) {
    const primera = opciones.find((o) => o.disponible) ?? opciones[0]
    if (primera) inicial[nombre] = primera.valor
  }
  return inicial
}

/** Precio base más los recargos de lo que esté seleccionado. */
export function precioConVariantes(
  precioBase: number,
  seleccionadas: Record<string, string>,
  grupos: GruposVariantes,
): number {
  let precio = precioBase
  for (const [nombre, valor] of Object.entries(seleccionadas)) {
    const opcion = grupos[nombre]?.find((v) => v.valor === valor)
    if (opcion?.precio_adicional) precio += opcion.precio_adicional
  }
  return precio
}

/** "Color: Naranja cósmico, Almacenamiento: 512 GB" — lo que ve el pedido. */
export function textoVariante(seleccionadas: Record<string, string>): string | undefined {
  const texto = Object.entries(seleccionadas)
    .map(([nombre, valor]) => `${nombre}: ${valor}`)
    .join(', ')
  return texto || undefined
}

export function faltanOpciones(grupos: GruposVariantes, seleccionadas: Record<string, string>): boolean {
  return Object.keys(grupos).some((nombre) => !seleccionadas[nombre])
}
