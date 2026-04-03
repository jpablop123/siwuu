export default function CuentaLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
        <div className="space-y-4">
          <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  )
}
