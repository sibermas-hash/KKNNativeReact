export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Placeholder</p>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description ?? 'Shell siap. Business page belum dipindah.'}</p>
    </section>
  )
}
