import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Categoria } from '@/types'
import { CategoriasManager } from './CategoriasManager'

export const metadata: Metadata = {
  title: 'Categorías - Admin',
  robots: 'noindex',
}

export default async function AdminCategoriasPage() {
  const supabase = createClient()

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .order('orden')

  // Count active products per category
  const { data: productCounts } = await supabase
    .from('productos')
    .select('categoria_id')
    .eq('activo', true)

  const countMap: Record<string, number> = {}
  for (const p of productCounts || []) {
    if (p.categoria_id) {
      countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1
    }
  }

  const cats = ((categorias as Categoria[]) || []).map((c) => ({
    ...c,
    productos_count: countMap[c.id] || 0,
  }))

  return (
    <div>
      <CategoriasManager categorias={cats} />
    </div>
  )
}
