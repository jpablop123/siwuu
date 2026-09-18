/**
 * Búsquedas recientes, guardadas solo en este navegador.
 *
 * Todo va en try/catch: en modo incógnito o con el almacenamiento bloqueado,
 * localStorage lanza error, y el buscador tiene que seguir funcionando igual.
 */

const CLAVE = 'siwuu-busquedas-recientes'
const MAXIMO = 5

export function leerRecientes(): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(valor) ? valor.filter((x): x is string => typeof x === 'string').slice(0, MAXIMO) : []
  } catch {
    return []
  }
}

export function guardarReciente(termino: string): void {
  const limpio = termino.trim()
  if (limpio.length < 2) return
  try {
    const lista = [limpio, ...leerRecientes().filter((x) => x.toLowerCase() !== limpio.toLowerCase())]
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, MAXIMO)))
  } catch {
    // Sin almacenamiento, simplemente no hay recientes.
  }
}

export function borrarRecientes(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que hacer
  }
}
