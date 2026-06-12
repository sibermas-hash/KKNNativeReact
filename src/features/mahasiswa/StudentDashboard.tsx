import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Lock, UsersRound } from 'lucide-react'
import { api } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/auth'
import { DailyReportsPage } from './reports/DailyReportsPage'
import { FinalReportPage } from './final-report/FinalReportPage'
import { WorkProgramsPage } from './work-programs/WorkProgramsPage'
import { CertificatePage } from './CertificatePage'
import { PoskoPage } from './posko/PoskoPage'
import { PosterPage } from './poster/PosterPage'
import { LeavePage } from './leave/LeavePage'

type Rec = Record<string, unknown>
type Dashboard = {
  currentPhase?: string
  phase?: string | Rec
  registration?: Rec
  pendaftaran?: Rec
  kkn?: Rec
  kelompok?: Rec
  group?: Rec
  dpl?: Rec
  grade?: Rec
  nilai?: Rec
  profile?: Rec
  mahasiswa?: Rec
  student?: Rec
}
type Profile = Rec & { profile_completed?: boolean; is_complete?: boolean; completed?: boolean; mahasiswa?: Rec; student?: Rec }

const requiredProfileFields = ['nim', 'nama', 'name', 'email', 'no_hp', 'phone', 'prodi', 'program_studi', 'fakultas', 'alamat']

function text(value: unknown, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return fallback
  return String(value)
}

function pick(obj: unknown, keys: string[]) {
  if (!obj || typeof obj !== 'object') return undefined
  const rec = obj as Rec
  for (const key of keys) if (rec[key] !== undefined && rec[key] !== null && rec[key] !== '') return rec[key]
  return undefined
}

function nested(data: Dashboard | undefined, keys: string[]) {
  for (const root of [data, data?.registration, data?.pendaftaran, data?.kkn, data?.kelompok, data?.group, data?.dpl, data?.grade, data?.nilai, data?.profile, data?.mahasiswa, data?.student]) {
    const found = pick(root, keys)
    if (found !== undefined) return found
  }
  return undefined
}

function isComplete(profile?: Profile, dashboard?: Dashboard, authComplete?: boolean) {
  if (authComplete === true) return true
  if (authComplete === false) return false
  const source = profile?.mahasiswa ?? profile?.student ?? profile ?? dashboard?.profile ?? dashboard?.mahasiswa ?? dashboard?.student
  const explicit = pick(source, ['profile_completed', 'is_complete', 'completed', 'isCompleted', 'lengkap'])
  if (typeof explicit === 'boolean') return explicit
  if (explicit === 1 || explicit === '1' || explicit === 'true' || explicit === 'lengkap') return true
  if (explicit === 0 || explicit === '0' || explicit === 'false' || explicit === 'belum_lengkap') return false
  if (!source || typeof source !== 'object') return false
  const rec = source as Rec
  return requiredProfileFields.filter((key) => rec[key] !== undefined && rec[key] !== null && rec[key] !== '').length >= 5
}

function isKknSelesai(jenis: string, periode: string, status: string, phase: string) {
  const j = jenis.toLowerCase()
  const p = periode.toLowerCase()
  const s = `${status} ${phase}`.toLowerCase()
  if (s.includes('selesai') || s.includes('completed')) return true
  if (j.includes('magang') && (j.includes('ftik') || p.includes('ftik'))) return true
  if (j.includes('reguler')) return [...periode.matchAll(/\d+/g)].map((m) => Number(m[0])).some((n) => n >= 51 && n <= 57)
  return false
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}><h2 className="mb-3 font-semibold text-slate-800">{title}</h2>{children}</section>
}

function Row({ label, value }: { label: string; value: unknown }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0"><span className="text-sm text-slate-500">{label}</span><span className="text-right text-sm font-medium text-slate-800">{text(value)}</span></div>
}

function ProfileBlocker({ complete }: { complete: boolean }) {
  if (complete) return null
  return <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><div className="flex gap-3"><Lock className="mt-0.5 h-5 w-5" /><div><div className="font-semibold">Profil belum lengkap</div><p className="text-sm">Lengkapi profil mahasiswa sebelum akses fitur KKN lanjutan.</p><a href="/mahasiswa/profil" className="mt-3 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700">Lengkapi profil</a></div></div></div>
}

function ProfilePage({ profile, dashboard, complete }: { profile?: Profile; dashboard?: Dashboard; complete: boolean }) {
  const source = profile?.mahasiswa ?? profile?.student ?? profile ?? dashboard?.profile ?? dashboard?.mahasiswa ?? dashboard?.student
  return <div className="space-y-4"><ProfileBlocker complete={complete} /><Card title="Profil Mahasiswa"><Row label="NIM" value={pick(source, ['nim', 'student_number'])} /><Row label="Nama" value={pick(source, ['nama', 'name'])} /><Row label="Email" value={pick(source, ['email'])} /><Row label="No. HP" value={pick(source, ['no_hp', 'phone', 'telepon'])} /><Row label="Program Studi" value={pick(source, ['prodi', 'program_studi', 'major'])} /><Row label="Fakultas" value={pick(source, ['fakultas', 'faculty'])} /><Row label="Alamat" value={pick(source, ['alamat', 'address'])} /></Card></div>
}

export function StudentDashboard({ currentPath }: { currentPath: string }) {
  const { user } = useAuth()
  const dashboard = useQuery({ queryKey: ['student-dashboard'], queryFn: () => api.get<Dashboard>('/student/dashboard').then((r) => r.data) })
  const profile = useQuery({ queryKey: ['student-profile'], queryFn: () => api.get<Profile>('/student/profile').then((r) => r.data), retry: false })
  const data = dashboard.data
  const complete = useMemo(() => isComplete(profile.data, data, user?.profile_completed), [profile.data, data, user?.profile_completed])

  if (currentPath.includes('laporan-akhir')) return <FinalReportPage />
  if (currentPath.includes('program-kerja')) {
    const parts = currentPath.split('/').filter(Boolean)
    const last = parts.at(-1)
    const mode = last === 'buat' ? 'create' : last && last !== 'program-kerja' ? 'detail' : 'list'
    return <WorkProgramsPage mode={mode} id={mode === 'detail' ? last : undefined} />
  }
  if (currentPath.includes('sertifikat')) return <CertificatePage />
  if (currentPath.includes('laporan-harian')) return <DailyReportsPage />
  if (currentPath.includes('posko')) return <PoskoPage />
  if (currentPath.includes('poster')) return <PosterPage />
  if (currentPath.includes('izin')) return <LeavePage />

  if (dashboard.isLoading) return <div className="text-slate-500">Memuat dashboard...</div>
  if (dashboard.isError) return <div className="rounded-xl bg-amber-50 p-4 text-amber-800">Belum bisa membaca dashboard API. Ini normal di scaffold awal beta.</div>

  const jenis = text(nested(data, ['jenis_kkn', 'jenisKkn', 'jenis', 'type']))
  const periode = text(nested(data, ['periode', 'period', 'angkatan']))
  const status = text(nested(data, ['status_pendaftaran', 'status_kkn', 'status']))
  const phase = text(data?.currentPhase ?? nested(data, ['phase', 'fase', 'current_phase', 'nama_phase']))
  const kelompok = text(nested(data, ['kelompok', 'group_name', 'nama_kelompok', 'group']))
  const dpl = text(nested(data, ['dpl_name', 'nama_dpl', 'dpl']))
  const nilai = text(nested(data, ['nilai', 'total_score', 'score', 'total_nilai']))
  const grade = text(nested(data, ['grade', 'letter_grade', 'nilai_huruf']))
  const selesai = isKknSelesai(jenis, periode, status, phase)

  if (currentPath.includes('profil')) return <ProfilePage profile={profile.data} dashboard={data} complete={complete} />

  return <div className="space-y-4"><ProfileBlocker complete={complete} /><div className="grid gap-4 lg:grid-cols-3"><Card title="Status KKN"><p className="text-2xl font-bold text-emerald-700">{status}</p><p className="text-sm text-slate-500">Phase: {phase}</p></Card><Card title="Jenis/Periode"><p className="text-slate-700">{jenis}</p><p className="text-sm text-slate-500">{periode}</p></Card><Card title="Nilai"><p className="text-2xl font-bold text-slate-800">{nilai}</p><p className="text-sm text-slate-500">Grade {grade}</p></Card></div><div className="grid gap-4 lg:grid-cols-2"><Card title="Kelompok & DPL"><div className="flex items-center gap-3 text-slate-700"><UsersRound className="h-5 w-5 text-emerald-700" /><div><div>Kelompok: {kelompok}</div><div className="text-sm text-slate-500">DPL: {dpl}</div></div></div></Card><Card title="KKN Selesai"><div className="flex items-center gap-3"><CheckCircle2 className={`h-5 w-5 ${selesai ? 'text-emerald-600' : 'text-slate-400'}`} /><span className="font-medium text-slate-800">{selesai ? 'Selesai' : 'Belum selesai'}</span></div><p className="mt-2 text-sm text-slate-500">Rule: Reguler 51–57 + Magang FTIK.</p></Card></div>{!complete && <Card title="Akses Fitur" className="border-amber-200"><div className="flex gap-3 text-amber-800"><AlertTriangle className="h-5 w-5" /><p className="text-sm">Fitur lanjutan diblokir sampai profil lengkap.</p></div></Card>}<Card title="Ringkasan Pendaftaran"><Row label="Status Pendaftaran/KKN" value={status} /><Row label="Jenis KKN" value={jenis} /><Row label="Periode" value={periode} /><Row label="Phase" value={phase} /><Row label="Kelompok" value={kelompok} /><Row label="DPL" value={dpl} /><Row label="Nilai" value={nilai} /><Row label="Grade" value={grade} /></Card></div>
}
