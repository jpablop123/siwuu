/**
 * Schema Zod compartido para creación/edición de cupones desde el admin.
 * Acepta strings de FormData y los coerciona a los tipos finales.
 */

import { z } from 'zod'

// Códigos: A-Z 0-9 _ - , entre 3 y 30 chars. Forzar UPPER al guardar.
const CODIGO_REGEX = /^[A-Z0-9_-]{3,30}$/

export const cuponInputSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(CODIGO_REGEX, 'Solo letras mayúsculas, números, guión y guión bajo (3–30 caracteres)'),

    tipo: z.enum(['porcentaje', 'fijo'], {
      message: 'Elegí un tipo de descuento',
    }),

    // Coerción: el form manda string, Zod lo pasa a number
    valor: z.coerce.number().positive('El valor debe ser mayor a 0'),

    // Opcionales: empty string → undefined → null al guardar
    minimo_compra: z
      .union([z.literal(''), z.coerce.number().nonnegative()])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),

    usos_maximos: z
      .union([z.literal(''), z.coerce.number().int().positive()])
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),

    // Datetime-local del input HTML viene como 'YYYY-MM-DDTHH:mm' sin tz
    expira_en: z
      .union([z.literal(''), z.string()])
      .optional()
      .transform((v) => {
        if (!v || v === '') return null
        const d = new Date(v)
        return isNaN(d.getTime()) ? null : d.toISOString()
      }),

    activo: z.coerce.boolean().optional().default(true),
  })
  // Porcentaje no puede pasarse de 100
  .refine((d) => d.tipo !== 'porcentaje' || d.valor <= 100, {
    message: 'El porcentaje no puede ser mayor a 100',
    path: ['valor'],
  })

export type CuponInput = z.input<typeof cuponInputSchema>
export type CuponData  = z.output<typeof cuponInputSchema>
