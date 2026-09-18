/**
 * Reglas del servicio de pedidos especiales (encargos desde Estados Unidos).
 *
 * Mezcla dos cosas distintas y conviene no confundirlas:
 *
 *  1. TARIFAS DE SIWUU — las pones tú. Cámbialas cuando cambie tu operación.
 *  2. REGLAS DE ADUANA COLOMBIANA — no las pones tú. Vienen de la DIAN y de la
 *     CRC, y se citan acá para que el cliente sepa a qué atenerse antes de pagar.
 *     Conviene revisarlas con tu operador logístico cada tanto: cambian.
 */

/* ── 1. Tarifas de Siwuu ──────────────────────────────────────────────────── */

/**
 * Lo que TE cuesta a ti cada libra desde Miami, todo incluido: el courier ya
 * trae aduana e impuestos adentro. Este número no se le muestra al cliente.
 * AJÚSTALO con la factura real del courier.
 */
export const COSTO_LIBRA_USD = 5

/** Lo que le cobras al cliente por libra. Tiene que ir por encima del costo. */
export const TARIFA_LIBRA_USD = 7

/** Se cobra mínimo una libra, aunque el producto pese menos. */
export const PESO_MINIMO_LB = 1

/** Utilidad de Siwuu sobre el costo total: producto + flete. */
export const UTILIDAD_PCT = 0.15

/** Piso de utilidad: por debajo de esto el pedido no vale la pena gestionarlo. */
export const UTILIDAD_MINIMA_USD = 15

/** Días hábiles desde que el cliente confirma el pago hasta la entrega. */
export const DIAS_ENTREGA = '8 a 12 días hábiles'

/**
 * ¿El catálogo mezcla stock local con producto importado?
 *
 * Hoy es FALSE: todo se trae de Estados Unidos. Por eso el badge "Importado"
 * no se muestra en las tarjetas del grid — repetirlo en las 24 no informa nada
 * y se come el presupuesto de naranja de la marca, igual que hacía el "-17%".
 * En la ficha sí aparece, porque ahí lo que importa es el plazo.
 *
 * Cuando exista inventario en Colombia, pon esto en TRUE y el badge vuelve:
 * ahí sí distingue.
 */
export const CATALOGO_MIXTO = false

/* ── 2. Reglas de aduana (DIAN) ───────────────────────────────────────────── */
//
// El cliente no paga impuestos aparte: van dentro de la tarifa por libra del
// courier. Estos valores quedan como referencia para la operación.

export const EXENCION_USD = 200
export const IVA_PCT = 0.19
export const ARANCEL_PCT = 0.10

/** Máximo de unidades iguales en un mismo envío. */
export const MAX_UNIDADES_IGUALES = 6

/** Límites físicos del envío. */
export const MAX_PESO_LB = 110          // ~50 kg por orden
export const MAX_DIMENSIONES_M = 3      // suma de las tres dimensiones

/* ── 3. Categorías ────────────────────────────────────────────────────────── */

export interface CategoriaEncargo {
  id: string
  nombre: string
  /** Aviso que se muestra al cliente cuando la elige. */
  aviso?: string
  /** true cuando la categoría tiene trámite especial y no se puede consolidar. */
  tramiteEspecial?: boolean
}

export const CATEGORIAS_ENCARGO: CategoriaEncargo[] = [
  {
    id: 'celulares',
    nombre: 'Celulares y smartwatches',
    tramiteEspecial: true,
    aviso:
      'Los celulares tienen trámite propio: van solos en su envío, siempre pagan impuestos y necesitan IMEI y homologación. Te acompañamos en todo el proceso.',
  },
  { id: 'computadores', nombre: 'Computadores y tablets' },
  { id: 'tecnologia', nombre: 'Otra tecnología y accesorios' },
  { id: 'camaras', nombre: 'Cámaras y fotografía' },
  { id: 'ropa', nombre: 'Ropa y calzado' },
  { id: 'belleza', nombre: 'Belleza y cuidado personal' },
  { id: 'hogar', nombre: 'Hogar y decoración' },
  { id: 'repuestos', nombre: 'Repuestos y herramientas' },
  { id: 'otro', nombre: 'Otra cosa' },
]

/* ── 4. Reglas para celulares ─────────────────────────────────────────────── */

/**
 * Importar un celular a Colombia no es como traer unos tenis. Estas son las
 * condiciones que la DIAN y la CRC exigen, y por las que un paquete se puede
 * quedar retenido.
 */
export const REGLAS_CELULARES = [
  {
    titulo: 'Tiene que ser nuevo y sellado',
    detalle:
      'La DIAN no permite el ingreso de equipos usados, remanufacturados ni reacondicionados por esta vía. Solo compramos equipos nuevos en su empaque original.',
  },
  {
    titulo: 'El modelo debe estar homologado en Colombia',
    detalle:
      'Si el modelo no está homologado ante la CRC, los operadores lo bloquean y el equipo no sirve con ninguna SIM del país. Lo verificamos antes de comprarlo.',
  },
  {
    titulo: 'Un equipo por envío',
    detalle:
      'No se pueden traer dos celulares en el mismo paquete, ni siquiera de referencias distintas, ni juntarlo con otras compras. Cada equipo viaja con su propia guía.',
  },
  {
    titulo: 'El trámite cuesta más',
    detalle:
      'Un celular paga impuestos sí o sí y viaja con guía propia, así que su costo de importación es más alto que el de un accesorio. Todo eso va dentro del precio que te cotizamos.',
  },
  {
    titulo: 'La factura lleva el IMEI',
    detalle:
      'La factura debe traer marca, modelo, el IMEI de 15 dígitos y el valor realmente pagado. Sin eso la aduana no autoriza la entrada.',
  },
]

/* ── 5. Lo que no se puede traer ──────────────────────────────────────────── */

export const PROHIBIDOS = [
  'Armas de fuego, blancas y sus componentes',
  'Explosivos, inflamables o materiales peligrosos',
  'Sustancias psicoactivas y medicamentos controlados',
  'Animales vivos y productos de especies protegidas',
  'Drones',
  'Dinero en efectivo, divisas y piedras preciosas',
  'Residuos tóxicos o radiactivos',
  'Réplicas y productos falsificados',
] as const

/* ── 6. Cálculo de la cotización ──────────────────────────────────────────── */

export interface Cotizacion {
  librasCobradas: number
  envio: number
  servicio: number
  totalUsd: number
  totalCop: number
}

/**
 * Calcula el estimado de un encargo.
 *
 * La tarifa por libra ya trae aduana e impuestos, así que el cliente ve un solo
 * precio final: no paga nada cuando el paquete llega. Sobre ese costo va la
 * utilidad de Siwuu por comprar, traer y responder por el pedido.
 */
export function cotizar({
  valorUsd,
  pesoLb,
  trm,
}: {
  valorUsd: number
  pesoLb: number
  trm: number
}): Cotizacion | null {
  if (valorUsd <= 0) return null

  const librasCobradas = Math.max(pesoLb || 0, PESO_MINIMO_LB)
  const envio = librasCobradas * TARIFA_LIBRA_USD
  const servicio = Math.max((valorUsd + envio) * UTILIDAD_PCT, UTILIDAD_MINIMA_USD)
  const totalUsd = valorUsd + envio + servicio

  return {
    librasCobradas,
    envio,
    servicio,
    totalUsd,
    totalCop: totalUsd * trm,
  }
}

/* ── 7. Preguntas propias del servicio de encargos ────────────────────────── */

export const FAQ_ENCARGOS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Cuánto cuesta traer algo de Estados Unidos?',
    respuesta:
      `El producto al precio de la tienda gringa, más US$ ${TARIFA_LIBRA_USD} por libra para traerlo, más nuestro servicio. Ahí ya va todo: aduana, impuestos y el envío nacional hasta tu puerta. Cuando el paquete llegue no pagas un peso más. La calculadora de arriba te lo arma en pesos.`,
  },
  {
    pregunta: '¿Cuándo pago y cómo?',
    respuesta:
      'Primero te cotizamos: si el precio te sirve, pagas en pesos con Nequi, PSE, Bancolombia o tarjeta a través de Wompi. Solo después de tu pago compramos el producto en Estados Unidos. No necesitas tarjeta internacional ni cuenta en dólares.',
  },
  {
    pregunta: '¿Tengo que abrir un casillero o dar mi dirección de Miami?',
    respuesta:
      'No. Esa es la diferencia con un casillero: tú no compras ni tramitas nada. Nos mandas el link, nosotros hacemos la compra a nuestro nombre, la recibimos en Miami y la traemos. Tú solo recibes en tu casa.',
  },
  {
    pregunta: '¿Tengo que pagar impuestos o aduana cuando llegue?',
    respuesta:
      'No. Los impuestos y el trámite de aduana ya están dentro del precio que te cotizamos. El día que te entregamos el paquete no pagas nada: ni al mensajero, ni a la DIAN, ni a nosotros.',
  },
  {
    pregunta: '¿Puedo pedir varias cosas de tiendas distintas?',
    respuesta:
      'Sí, las agrupamos en un mismo envío siempre que el total respete los límites de valor y peso. Los celulares son la excepción: cada equipo viaja solo, con su propia guía.',
  },
  {
    pregunta: '¿Y si el producto llega malo o no es el que pedí?',
    respuesta:
      'Nos haces saber apenas lo recibas y gestionamos el reclamo con la tienda o con la garantía del fabricante. Escríbenos por WhatsApp con fotos y el número de guía.',
  },
]
