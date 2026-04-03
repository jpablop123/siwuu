export default function PedidosLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5"
        >
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
