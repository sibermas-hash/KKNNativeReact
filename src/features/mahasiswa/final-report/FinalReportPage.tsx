import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/api/client'

type FinalReport = {
  id?: number | string
  title?: string
  file_name?: string
  file_url?: string
  status?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

type FinalReportStatus = {
  status?: string
  can_upload?: boolean
  uploaded?: boolean
  report?: FinalReport
  reports?: FinalReport[]
}

const endpoints = {
  status: '/student/final-report/status',
  list: '/student/final-reports',
  upload: '/student/final-reports',
}

function errMsg(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan.'
}

function Badge({ value }: { value?: string }) {
  const text = value || 'Belum ada status'
  const color = text.toLowerCase().includes('approve') || text.toLowerCase().includes('disetujui') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{text}</span>
}

export function FinalReportPage() {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')

  const status = useQuery({ queryKey: ['final-report-status'], queryFn: () => api.get<FinalReportStatus>(endpoints.status).then((r) => r.data) })
  const list = useQuery({ queryKey: ['final-reports'], queryFn: () => api.get<FinalReport[]>(endpoints.list).then((r) => r.data) })

  const reports = useMemo(() => {
    const fromStatus = status.data?.reports ?? (status.data?.report ? [status.data.report] : [])
    return list.data?.length ? list.data : fromStatus
  }, [list.data, status.data])

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Pilih file laporan akhir terlebih dahulu.')
      const fd = new FormData()
      fd.append('file', file)
      if (title.trim()) fd.append('title', title.trim())
      return api.post(endpoints.upload, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
    },
    onSuccess: () => {
      setFile(null); setTitle('')
      qc.invalidateQueries({ queryKey: ['final-report-status'] })
      qc.invalidateQueries({ queryKey: ['final-reports'] })
    },
  })

  if (status.isLoading || list.isLoading) return <div className="text-slate-500">Memuat laporan akhir...</div>

  return (
    <div className="space-y-5">
      {(status.isError || list.isError) && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Gagal memuat sebagian data: {errMsg(status.error || list.error)}</div>}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-800">Status Laporan Akhir</h2><p className="text-sm text-slate-500">Endpoint: {endpoints.status}</p></div><Badge value={status.data?.status ?? status.data?.report?.status} /></div>
        <p className="mt-3 text-sm text-slate-600">Upload: {status.data?.can_upload === false ? 'Belum diizinkan' : 'Diizinkan bila periode aktif'}</p>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Upload Laporan Akhir</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul (opsional)" className="rounded-xl border px-3 py-2 text-sm" />
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-xl border px-3 py-2 text-sm" />
          <button disabled={!file || upload.isPending || status.data?.can_upload === false} onClick={() => upload.mutate()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{upload.isPending ? 'Mengunggah...' : 'Upload'}</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Payload: multipart FormData {`{ file, title? }`}. Tidak otomatis upload tanpa klik.</p>
        {upload.isError && <p className="mt-2 text-sm text-red-600">{errMsg(upload.error)}</p>}
        {upload.isSuccess && <p className="mt-2 text-sm text-emerald-700">Laporan berhasil dikirim.</p>}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Riwayat Laporan</h2>
        {!reports.length ? <p className="text-sm text-slate-500">Belum ada laporan akhir.</p> : <div className="divide-y">{reports.map((r, i) => <div key={r.id ?? i} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-slate-800">{r.title || r.file_name || `Laporan #${r.id ?? i + 1}`}</div><Badge value={r.status} /></div><p className="text-xs text-slate-500">{r.updated_at || r.created_at || '-'}</p>{r.notes && <p className="mt-1 text-sm text-slate-600">{r.notes}</p>}{r.file_url && <a className="mt-1 inline-block text-sm font-medium text-emerald-700" href={r.file_url} target="_blank" rel="noreferrer">Lihat file</a>}</div>)}</div>}
      </section>
    </div>
  )
}
