/**
 * Países con código telefónico y cantidad de dígitos local.
 *
 * Cobertura: principales de Latinoamérica + USA + España (mercado objetivo
 * de un e-commerce colombiano que vende a expats / family abroad).
 *
 * `digits` es el número de dígitos del número LOCAL (sin contar el código
 * de país). Cuando aceptamos un rango (Brasil), guardamos un array.
 *
 * Formato final guardado en BD: "+{code} {numero}"  ej. "+57 3001234567"
 */

export interface CountryPhone {
  /** ISO 3166-1 alpha-2 — usado como key */
  iso: string
  /** Nombre en español */
  nombre: string
  /** Código internacional sin el "+" */
  code: string
  /** Emoji de la bandera */
  flag: string
  /** Cantidad de dígitos del número local. Acepta array si hay variantes. */
  digits: number | readonly number[]
  /** Ejemplo de un número válido (sin el código) — para placeholder */
  ejemplo: string
}

export const COUNTRIES: readonly CountryPhone[] = [
  // Colombia primero (mercado principal)
  { iso: 'CO', nombre: 'Colombia',          code: '57',  flag: '🇨🇴', digits: 10,        ejemplo: '3001234567'  },

  // Latinoamérica (orden alfabético)
  { iso: 'AR', nombre: 'Argentina',         code: '54',  flag: '🇦🇷', digits: 10,        ejemplo: '1123456789'  },
  { iso: 'BO', nombre: 'Bolivia',           code: '591', flag: '🇧🇴', digits: 8,         ejemplo: '71234567'    },
  { iso: 'BR', nombre: 'Brasil',            code: '55',  flag: '🇧🇷', digits: [10, 11],  ejemplo: '11912345678' },
  { iso: 'CL', nombre: 'Chile',             code: '56',  flag: '🇨🇱', digits: 9,         ejemplo: '912345678'   },
  { iso: 'CR', nombre: 'Costa Rica',        code: '506', flag: '🇨🇷', digits: 8,         ejemplo: '85123456'    },
  { iso: 'CU', nombre: 'Cuba',              code: '53',  flag: '🇨🇺', digits: 8,         ejemplo: '51234567'    },
  { iso: 'DO', nombre: 'República Dominicana', code: '1', flag: '🇩🇴', digits: 10,        ejemplo: '8091234567'  },
  { iso: 'EC', nombre: 'Ecuador',           code: '593', flag: '🇪🇨', digits: 9,         ejemplo: '991234567'   },
  { iso: 'SV', nombre: 'El Salvador',       code: '503', flag: '🇸🇻', digits: 8,         ejemplo: '71234567'    },
  { iso: 'GT', nombre: 'Guatemala',         code: '502', flag: '🇬🇹', digits: 8,         ejemplo: '51234567'    },
  { iso: 'HN', nombre: 'Honduras',          code: '504', flag: '🇭🇳', digits: 8,         ejemplo: '91234567'    },
  { iso: 'MX', nombre: 'México',            code: '52',  flag: '🇲🇽', digits: 10,        ejemplo: '5512345678'  },
  { iso: 'NI', nombre: 'Nicaragua',         code: '505', flag: '🇳🇮', digits: 8,         ejemplo: '81234567'    },
  { iso: 'PA', nombre: 'Panamá',            code: '507', flag: '🇵🇦', digits: 8,         ejemplo: '61234567'    },
  { iso: 'PY', nombre: 'Paraguay',          code: '595', flag: '🇵🇾', digits: 9,         ejemplo: '981234567'   },
  { iso: 'PE', nombre: 'Perú',              code: '51',  flag: '🇵🇪', digits: 9,         ejemplo: '912345678'   },
  { iso: 'PR', nombre: 'Puerto Rico',       code: '1',   flag: '🇵🇷', digits: 10,        ejemplo: '7871234567'  },
  { iso: 'UY', nombre: 'Uruguay',           code: '598', flag: '🇺🇾', digits: 8,         ejemplo: '94123456'    },
  { iso: 'VE', nombre: 'Venezuela',         code: '58',  flag: '🇻🇪', digits: 10,        ejemplo: '4121234567'  },

  // No-LatAm pero relevantes
  { iso: 'ES', nombre: 'España',            code: '34',  flag: '🇪🇸', digits: 9,         ejemplo: '612345678'   },
  { iso: 'US', nombre: 'Estados Unidos',    code: '1',   flag: '🇺🇸', digits: 10,        ejemplo: '2125550123'  },
  { iso: 'CA', nombre: 'Canadá',            code: '1',   flag: '🇨🇦', digits: 10,        ejemplo: '4165550123'  },
] as const

/** El default cuando no hay país seleccionado */
export const DEFAULT_COUNTRY = COUNTRIES[0]   // Colombia

/** Busca un país por su código ISO (CO, MX, ...) */
export function findByIso(iso: string): CountryPhone | undefined {
  return COUNTRIES.find((c) => c.iso === iso)
}

/** Verifica si un string de dígitos es válido para un país dado */
export function isValidDigits(country: CountryPhone, numero: string): boolean {
  const onlyDigits = numero.replace(/\D/g, '')
  const digitsField = country.digits
  if (typeof digitsField === 'number') {
    return onlyDigits.length === digitsField
  }
  return digitsField.includes(onlyDigits.length)
}

/** Devuelve el "máximo" de dígitos para el atributo maxLength del input */
export function maxDigits(country: CountryPhone): number {
  return typeof country.digits === 'number'
    ? country.digits
    : Math.max(...country.digits)
}

/** Compone el string final: "+CODE numero" sin separadores extra */
export function formatPhone(country: CountryPhone, numero: string): string {
  return `+${country.code} ${numero.replace(/\D/g, '')}`
}

/**
 * Intenta parsear un string ya guardado (ej. "+57 3001234567") y devolver
 * { country, numero }. Si no matchea ninguno, asume Colombia.
 */
export function parsePhone(stored: string): { country: CountryPhone; numero: string } {
  const trimmed = stored.trim()
  if (!trimmed) return { country: DEFAULT_COUNTRY, numero: '' }

  // Caso normal: "+57 ..." o "+593 ..."
  const match = trimmed.match(/^\+(\d{1,4})\s*(.+)$/)
  if (match) {
    const [, code, rest] = match
    // Buscar el país con ese code. Si hay varios (ej. +1 = US, CA, DO, PR),
    // tomamos el primero (US). El usuario podrá re-elegirlo si quiere.
    const country = COUNTRIES.find((c) => c.code === code)
    if (country) return { country, numero: rest.replace(/\D/g, '') }
  }

  // Fallback: asumir Colombia y tomar lo que parezca número
  return { country: DEFAULT_COUNTRY, numero: trimmed.replace(/\D/g, '') }
}
