import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Proveedor } from '@/types'
import { ProveedoresManager } from './ProveedoresManager'

export const metadata: Metadata = {
  title: 'Proveedores - Admin',
  robots: 'noindex',
}

export default async function AdminProveedoresPage() {
  const supabase = createServiceClient()

  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre')

  // Count active products per provider
  const { data: productCounts } = await supabase
    .from('productos')
    .select('proveedor_id')
    .eq('activo', true)

  const countMap: Record<string, number> = {}
  for (const p of productCounts || []) {
    if (p.proveedor_id) {
      countMap[p.proveedor_id] = (countMap[p.proveedor_id] || 0) + 1
    }
  }

  const provs = ((proveedores as Proveedor[]) || []).map((p) => ({
    ...p,
    productos_count: countMap[p.id] || 0,
  }))

  return (
    <div>
      <ProveedoresManager proveedores={provs} />
    </div>
  )
}
