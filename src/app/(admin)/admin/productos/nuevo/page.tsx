import { createServiceClient } from '@/lib/supabase/server'
import { ProductoForm } from '@/components/admin/ProductoForm'
import type { Categoria, Proveedor } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuevo Producto - Admin',
  robots: 'noindex',
}

export default async function NuevoProductoPage() {
  const supabase = createServiceClient()

  const [catRes, provRes] = await Promise.all([
    supabase.from('categorias').select('*').eq('activa', true).order('nombre'),
    supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Nuevo producto</h1>
      <ProductoForm
        mode="crear"
        categorias={(catRes.data as Categoria[]) || []}
        proveedores={(provRes.data as Proveedor[]) || []}
      />
    </div>
  )
}
