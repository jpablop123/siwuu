/**
 * Schema Zod compartido para creación/edición de cupones desde el admin.
 * Acepta strings de FormData y los coerciona a los tipos finales.
 */

import { z } from 'zod'

// Códigos: A-Z 0-9 _ - , entre 3 y 30 chars. Forzar UPPER al guardar.
const CODIGO_REGEX = /^[A-Z0-9_-]{3,30}$/

// Helper: campo numérico opcional (empty string → null)
const optionalNumber = z
  .union([z.literal(''), z.coerce.number().nonnegative()])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v))

// Helper: campo datetime-local opcional (input HTML → ISO 8601 o null)
const optionalDateTime = z
  .union([z.literal(''), z.string()])
  .optional()
  .transform((v) => {
    if (!v || v === '') return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d.toISOString()
  })

// Helper: campo UUID opcional
const optionalUuid = z
  .union([z.literal(''), z.string().uuid('UUID inválido')])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v))

export const cuponInputSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(CODIGO_REGEX, 'Solo letras mayúsculas, números, guión y guión bajo (3–30 caracteres)'),

    tipo: z.enum(['porcentaje', 'fijo'], { message: 'Elegí un tipo de descuento' }),

    valor: z.coerce.number().positive('El valor debe ser mayor a 0'),

    minimo_compra: optionalNumber,
    usos_maximos: z
      .union([z.literal(''), z.coerce.number().int().positive()])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    expira_en:   optionalDateTime,
    inicia_en:   optionalDateTime,

    // Cap de descuento (para % grandes) — opcional
    descuento_maximo: optionalNumber,

    // Restricción de categoría (UUID o null)
    categoria_id: optionalUuid,

    // Booleanos de los checkboxes — vienen como 'on' o ausentes
    solo_primera_compra: z.coerce.boolean().optional().default(false),
    un_uso_por_cliente:  z.coerce.boolean().optional().default(false),
    activo:              z.coerce.boolean().optional().default(true),
  })
  .refine((d) => d.tipo !== 'porcentaje' || d.valor <= 100, {
    message: 'El porcentaje no puede ser mayor a 100',
    path: ['valor'],
  })
  .refine(
    (d) => d.inicia_en === null || d.expira_en === null || new Date(d.inicia_en) < new Date(d.expira_en),
    { message: 'La fecha de inicio debe ser anterior a la de expiración', path: ['inicia_en'] },
  )

export type CuponInput = z.input<typeof cuponInputSchema>
export type CuponData  = z.output<typeof cuponInputSchema>
