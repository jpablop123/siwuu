import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function ProductosLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block">
          <div className="space-y-6">
            <div>
              <div className="mb-3 h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-900" />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-900" />
                <div className="h-10 flex-1 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-900" />
              </div>
            </div>
          </div>
        </aside>

        {/* Grid skeleton */}
        <div>
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  )
}
