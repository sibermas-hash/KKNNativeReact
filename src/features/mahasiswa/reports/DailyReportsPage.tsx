import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Edit3, ImageIcon, Plus, RefreshCcw } from 'lucide-react'
import { api } from '../../../shared/api/client'
import { DAILY_REPORT_ENDPOINT, DailyReportForm, type DailyReport } from './DailyReportForm'

type ListResponse = DailyReport[] | { data?: DailyReport[]; items?: DailyReport[]; reports?: DailyReport[] }

function normalize(raw: ListResponse): DailyReport[] {
  if (Array.isArray(raw)) return raw
  return raw.data || raw.items || raw.reports || []
}

function text(report: DailyReport, ...keys: (keyof DailyReport)[]) {
  for (const key of keys) {
    const value = report[key]
    if (typeof value === 'string' && value) return value
  }
  return '-'
}

export function DailyReportsPage() {
  const path = window.location.pathname
  const pathParts = path.split('/').filter(Boolean)
  const routeMode = pathParts.at(-1) === 'buat' ? 'create' : pathParts.at(-1) === 'edit' ? 'edit' : 'list'
  const routeEditId = routeMode === 'edit' ? (pathParts.at(-2) ?? null) : null
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>(routeMode)
  const [editId, setEditId] = useState<string | null>(routeEditId)
  const reports = useQuery({ queryKey: ['student-daily-reports'], queryFn: () => api.get<ListResponse>(DAILY_REPORT_ENDPOINT).then((r) => normalize(r.data)) })

  const rows = useMemo(() => reports.data ?? [], [reports.data])
  const goList = () => { window.history.pushState(null, '', '/mahasiswa/laporan-harian'); setMode('list'); setEditId(null) }
  const done = () => { goList(); void reports.refetch() }

  if (mode === 'create') return <DailyReportForm onCancel={goList} onDone={done} />
  if (mode === 'edit') return <DailyReportForm id={editId} onCancel={goList} onDone={done} />

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div><h2 className="text-lg font-semibold text-slate-800">Laporan Harian</h2><p className="text-sm text-slate-500">Endpoint: {DAILY_REPORT_ENDPOINT}. Foto dikompresi sebelum upload.</p></div>
        <div className="flex gap-2">
          <button onClick={() => reports.refetch()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => { window.history.pushState(null, '', '/mahasiswa/laporan-harian/buat'); setMode('create') }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"><Plus className="h-4 w-4" /> Buat</button>
        </div>
      </div>

      {reports.isLoading && <div className="rounded-2xl border bg-white p-5 text-slate-500">Memuat laporan...</div>}
      {reports.isError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">Gagal membaca list laporan harian.</div>}
      {!reports.isLoading && !reports.isError && rows.length === 0 && <div className="rounded-2xl border bg-white p-5 text-slate-500">Belum ada laporan harian.</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((report) => {
          const id = String(report.id)
          const image = text(report, 'foto', 'photo', 'image')
          return (
            <article key={id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              {image !== '-' ? <img src={image} alt="Foto laporan" className="h-48 w-full object-cover" /> : <div className="grid h-48 place-items-center bg-slate-100 text-slate-400"><ImageIcon className="h-10 w-10" /></div>}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-slate-500">{text(report, 'tanggal', 'date')}</p><h3 className="font-semibold text-slate-800">{text(report, 'kegiatan', 'activity')}</h3></div>
                  <button onClick={() => { window.history.pushState(null, '', `/mahasiswa/laporan-harian/${id}/edit`); setEditId(id); setMode('edit') }} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-slate-50"><Edit3 className="h-4 w-4" /> Edit</button>
                </div>
                <p className="line-clamp-3 text-sm text-slate-600">{text(report, 'deskripsi', 'description')}</p>
                <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2"><p><span className="font-medium">Lokasi:</span> {text(report, 'lokasi', 'location')}</p><p><span className="font-medium">Kendala:</span> {text(report, 'kendala', 'obstacle')}</p></div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
