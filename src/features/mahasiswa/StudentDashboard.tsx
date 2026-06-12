import { useQuery } from '@tanstack/react-query'
import { api } from '../../shared/api/client'

type Dashboard = {
  currentPhase?: string
  registration?: { status?: string; jenis_kkn?: string; periode?: string }
  grade?: { total_score?: number; letter_grade?: string }
  certificates?: unknown[]
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="mb-3 font-semibold text-slate-800">{title}</h2>{children}</section>
}

export function StudentDashboard({ currentPath }: { currentPath: string }) {
  const dashboard = useQuery({ queryKey: ['student-dashboard'], queryFn: () => api.get<Dashboard>('/student/dashboard').then((r) => r.data) })

  if (dashboard.isLoading) return <div className="text-slate-500">Memuat dashboard...</div>
  if (dashboard.isError) return <div className="rounded-xl bg-amber-50 p-4 text-amber-800">Belum bisa membaca dashboard API. Ini normal di scaffold awal beta.</div>

  const data = dashboard.data

  if (currentPath.includes('sertifikat')) {
    return <Card title="Sertifikat & Nilai"><p className="text-slate-600">Nilai: {data?.grade?.total_score ?? '-'} ({data?.grade?.letter_grade ?? '-'})</p><p className="mt-2 text-sm text-slate-500">Halaman detail/download akan diparitas-kan dari Next lama.</p></Card>
  }

  if (currentPath.includes('laporan-harian')) {
    return <Card title="Laporan Harian"><p className="text-slate-600">Stub migrasi. Target berikut: list, create, edit, upload foto + kompresi.</p></Card>
  }

  if (currentPath.includes('profil')) {
    return <Card title="Profil Mahasiswa"><p className="text-slate-600">Stub migrasi. Target berikut: form profil wajib lengkap.</p></Card>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Status KKN"><p className="text-2xl font-bold text-emerald-700">{data?.registration?.status ?? '-'}</p><p className="text-sm text-slate-500">Phase: {data?.currentPhase ?? '-'}</p></Card>
      <Card title="Jenis/Periode"><p className="text-slate-700">{data?.registration?.jenis_kkn ?? '-'}</p><p className="text-sm text-slate-500">{data?.registration?.periode ?? '-'}</p></Card>
      <Card title="Nilai"><p className="text-2xl font-bold text-slate-800">{data?.grade?.total_score ?? '-'}</p><p className="text-sm text-slate-500">Grade {data?.grade?.letter_grade ?? '-'}</p></Card>
    </div>
  )
}
