import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Download, FileCheck2, ShieldAlert } from 'lucide-react'
import { api } from '../../shared/api/client'
import { downloadBlob } from '../../shared/api/download'

type Grade = {
  total_score?: number | string | null
  letter_grade?: string | null
  nilai_akhir?: number | string | null
  nilai_huruf?: string | null
  predikat?: string | null
}

type Certificate = {
  id?: number | string | null
  sertifikat_id?: number | string | null
  certificate_id?: number | string | null
  kelompok_id?: number | string | null
  title?: string | null
  name?: string | null
  jenis?: string | null
  type?: string | null
  nomor?: string | null
  nomor_sertifikat?: string | null
  status?: string | null
  valid?: boolean | null
  revoked?: boolean | null
  revoked_at?: string | null
  file_name?: string | null
  filename?: string | null
  download_url?: string | null
  pdf_url?: string | null
  url?: string | null
  endpoint?: string | null
}

type Dashboard = {
  currentPhase?: string
  registration?: { status?: string; jenis_kkn?: string; periode?: string }
  grade?: Grade | null
  certificates?: Certificate[] | null
}

const downloadEndpoint = (cert: Certificate) => {
  if (cert.download_url || cert.pdf_url || cert.url || cert.endpoint) return cert.download_url || cert.pdf_url || cert.url || cert.endpoint || ''
  const id = cert.id ?? cert.sertifikat_id ?? cert.certificate_id
  if (!id) return ''
  return cert.kelompok_id ? `/student/certificates/${id}/download?kelompok_id=${cert.kelompok_id}` : `/student/certificates/${id}/download`
}

const certTitle = (cert: Certificate) => cert.title || cert.name || cert.jenis || cert.type || 'Sertifikat KKN'
const certNumber = (cert: Certificate) => cert.nomor_sertifikat || cert.nomor || '-'
const certFilename = (cert: Certificate) => cert.file_name || cert.filename || `${String(certTitle(cert)).toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.pdf`

function statusOf(cert: Certificate) {
  if (cert.revoked || cert.revoked_at || cert.status?.toLowerCase() === 'revoked') return { label: 'Dicabut', cls: 'bg-rose-50 text-rose-700 ring-rose-200', icon: ShieldAlert }
  if (cert.valid === false || cert.status?.toLowerCase() === 'invalid') return { label: 'Tidak valid', cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: ShieldAlert }
  return { label: 'Valid', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: FileCheck2 }
}

export function CertificatePage() {
  const [downloading, setDownloading] = useState<string | number | null>(null)
  const dashboard = useQuery({ queryKey: ['student-dashboard'], queryFn: () => api.get<Dashboard>('/student/dashboard').then((r) => r.data) })
  const grade = dashboard.data?.grade
  const certificates = useMemo(() => dashboard.data?.certificates ?? [], [dashboard.data?.certificates])

  if (dashboard.isLoading) return <div className="text-slate-500">Memuat sertifikat...</div>
  if (dashboard.isError) return <div className="rounded-xl bg-amber-50 p-4 text-amber-800">Belum bisa membaca data sertifikat.</div>

  const total = grade?.total_score ?? grade?.nilai_akhir ?? '-'
  const letter = grade?.letter_grade ?? grade?.nilai_huruf ?? '-'

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-2 font-semibold text-slate-800">Nilai KKN</h2>
          <div className="flex flex-wrap items-end gap-6">
            <div><p className="text-sm text-slate-500">Nilai akhir</p><p className="text-4xl font-bold text-emerald-700">{total}</p></div>
            <div><p className="text-sm text-slate-500">Grade</p><p className="text-4xl font-bold text-slate-800">{letter}</p></div>
            {grade?.predikat ? <div><p className="text-sm text-slate-500">Predikat</p><p className="text-lg font-semibold text-slate-700">{grade.predikat}</p></div> : null}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-800">Status</h2>
          <p className="text-sm text-slate-500">{dashboard.data?.registration?.periode ?? '-'}</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">{dashboard.data?.registration?.status ?? dashboard.data?.currentPhase ?? '-'}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5"><h2 className="font-semibold text-slate-800">Daftar Sertifikat</h2></div>
        {certificates.length === 0 ? <div className="p-5 text-sm text-slate-500">Belum ada sertifikat.</div> : (
          <div className="divide-y">
            {certificates.map((cert, index) => {
              const id = cert.id ?? cert.sertifikat_id ?? cert.certificate_id ?? index
              const status = statusOf(cert)
              const StatusIcon = status.icon
              const endpoint = downloadEndpoint(cert)
              const disabled = !endpoint || downloading === id || status.label === 'Dicabut'
              return (
                <div key={String(id)} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Award className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-slate-800">{certTitle(cert)}</p>
                      <p className="text-sm text-slate-500">Nomor: {certNumber(cert)}</p>
                      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${status.cls}`}><StatusIcon className="h-3 w-3" />{status.label}</span>
                    </div>
                  </div>
                  <button
                    disabled={disabled}
                    onClick={async () => {
                      setDownloading(id)
                      try { await downloadBlob(endpoint, certFilename(cert)) } finally { setDownloading(null) }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Download className="h-4 w-4" />{downloading === id ? 'Mengunduh...' : 'Download PDF'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}


