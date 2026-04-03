import { createClient } from '@/lib/supabase/server'
import { ProductoForm } from '@/components/admin/ProductoForm'
import { notFound } from 'next/navigation'
import type { Producto, Categoria, Proveedor, Variante } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editar Producto - Admin',
  robots: 'noindex',
}

interface Props {
  params: { id: string }
}

export default async function EditarProductoPage({ params }: Props) {
  const supabase = createClient()

  const [productoRes, catRes, provRes] = await Promise.all([
    supabase.from('productos').select('*, variantes(*)').eq('id', params.id).single(),
    supabase.from('categorias').select('*').eq('activa', true).order('nombre'),
    supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
  ])

  if (!productoRes.data) notFound()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Editar producto</h1>
      <ProductoForm
        mode="editar"
        producto={productoRes.data as Producto & { variantes: Variante[] }}
        categorias={(catRes.data as Categoria[]) || []}
        proveedores={(provRes.data as Proveedor[]) || []}
      />
    </div>
  )
}
