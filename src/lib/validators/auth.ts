/**
 * Schemas Zod compartidos por el form de registro (cliente) y por el
 * server action `registrarse` (servidor). Una sola fuente de verdad
 * para las reglas — si se cambia algo acá, no hay forma de que cliente
 * y servidor diverjan.
 *
 * Auditor's note: las reglas reflejan OWASP 2024 + ajustes para
 * e-commerce colombiano (Habeas Data, validación de móvil COL).
 */

import { z } from 'zod'

// ── Constantes de negocio ─────────────────────────────────────────────────────

// Letras (incl. acentos), espacios, guiones, apóstrofos. Mínimo 2 chars.
// Rechaza emojis, números, símbolos.
const NAME_REGEX = /^[\p{L}\s'-]+$/u

// Móvil colombiano: 10 dígitos comenzando con 3.
// Se normaliza quitando todo lo no-numérico antes de validar.
const COL_MOBILE_REGEX = /^(57)?3\d{9}$/

// Listas defensivas — no exhaustivas, pero atrapan bots y typos triviales.
// El chequeo real contra breached passwords (HIBP) queda como futuro.
const COMMON_PASSWORDS = new Set([
  '12345678',  '123456789', '1234567890', 'password',  'password123',
  'qwerty123', 'qwerty1234','qwerty12345','111111111', '000000000',
  'colombia12','colombia2024','colombia2025','admin12345','administrator',
  'iloveyou12','monkey1234','football12','baseball12','welcome123',
  'letmein123','master1234','dragon1234','sunshine12','princess1',
  'asdfghjkl','qwertyuiop','zxcvbnm123','1q2w3e4r5t',
])

// Dominios de email desechable más comunes — bloquea fraude trivial.
// Mantener corta; los proveedores serios cambian de dominio constantemente
// y una lista enorme genera falsos positivos.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com',     '10minutemail.com',
  'guerrillamail.com', 'throwawaymail.com','maildrop.cc',
  'temp-mail.org', 'trashmail.com',     'yopmail.com',
  'fakeinbox.com', 'sharklasers.com',   'getnada.com',
  'tempmailo.com', 'mohmal.com',        'dispostable.com',
])

// ── Schema de registro ────────────────────────────────────────────────────────

/**
 * Acepta inputs crudos del form (strings de FormData) y los normaliza.
 *
 * Particularidades:
 * - `telefono`: se normaliza quitando espacios/símbolos antes de validar.
 * - `aceptaTerminos` / `aceptaPrivacidad`: checkboxes mandan `'on'` cuando
 *   están tildados y nada cuando no — usamos literal `'on'` como flag.
 * - `website`: campo honeypot invisible. Cualquier valor no vacío = bot.
 */
export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2,  'El nombre debe tener al menos 2 caracteres')
      .max(100,'El nombre es demasiado largo')
      .regex(NAME_REGEX, 'Solo letras, espacios, guiones y apóstrofos'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'El email es demasiado largo')
      .email('Email inválido')
      .refine((email) => {
        const domain = email.split('@')[1]
        return !DISPOSABLE_DOMAINS.has(domain)
      }, 'No aceptamos direcciones de email desechables'),

    telefono: z
      .string()
      .trim()
      .max(20)
      .transform((v) => v.replace(/\D/g, '')) // quitar espacios, +, paréntesis
      .refine(
        (v) => COL_MOBILE_REGEX.test(v),
        'Ingresá un número móvil colombiano válido (ej: 3001234567)',
      ),

    password: z
      .string()
      .min(10,  'La contraseña debe tener al menos 10 caracteres')
      .max(128, 'La contraseña es demasiado larga')
      .refine(
        (p) => !COMMON_PASSWORDS.has(p.toLowerCase()),
        'Esa contraseña es demasiado común. Elegí una más fuerte.',
      ),

    confirmarPassword: z.string(),

    // Checkboxes mandan 'on' o están ausentes. Z.literal('on') exige tildado.
    aceptaTerminos: z.literal('on', { message: 'Debés aceptar los términos y condiciones' }),
    aceptaPrivacidad: z.literal('on', { message: 'Debés aceptar la política de tratamiento de datos' }),

    // Honeypot — el form lo renderiza invisible. Humanos no lo llenan; bots sí.
    website: z.literal('', { message: 'Bot detectado' }),
  })
  // Cross-field: confirmación debe coincidir
  .refine((d) => d.password === d.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  })
  // Cross-field: la password no puede contener el local-part del email
  // (`juan@gmail.com` con password `juan12345678` → rechazado)
  .refine(
    (d) => {
      const local = d.email.split('@')[0].toLowerCase()
      return local.length < 3 || !d.password.toLowerCase().includes(local)
    },
    { message: 'La contraseña no puede contener tu email', path: ['password'] },
  )
  // Cross-field: la password no puede contener la primera palabra del nombre
  // (`Juan Pérez` con password `Juan123456` → rechazado)
  .refine(
    (d) => {
      const firstWord = d.nombre.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
      return firstWord.length < 3 || !d.password.toLowerCase().includes(firstWord)
    },
    { message: 'La contraseña no puede contener tu nombre', path: ['password'] },
  )

export type RegistroInput = z.input<typeof registroSchema>
export type RegistroData  = z.output<typeof registroSchema>

// ── Helper: extraer errores de campo en formato plano ────────────────────────

export type FieldErrors<T extends z.ZodTypeAny> = Partial<Record<keyof z.input<T> | 'global', string>>

export function flattenErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? 'global'
    // Conservar el primer error por campo (no sobreescribir)
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}
