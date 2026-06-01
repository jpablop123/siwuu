import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { CuponesManager } from './CuponesManager'

export const metadata: Metadata = {
  title: 'Cupones',
  robots: 'noindex',
}

interface CuponRow {
  id: string
  codigo: string
  tipo: 'porcentaje' | 'fijo'
  valor: number
  minimo_compra: number | null
  usos_maximos: number | null
  usos_actuales: number
  expira_en: string | null
  activo: boolean
  created_at: string
}

export default async function CuponesPage() {
  const supabase = createServiceClient()
  const { data: cupones } = await supabase
    .from('cupones')
    .select('*')
    .order('activo', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Cupones</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Códigos de descuento que los clientes aplican en checkout.
          </p>
        </div>
      </div>

      <CuponesManager cuponesIniciales={(cupones ?? []) as CuponRow[]} />
    </div>
  )
}
