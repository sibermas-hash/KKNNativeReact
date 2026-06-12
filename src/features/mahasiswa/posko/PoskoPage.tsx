import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Home, MapPin, RefreshCcw, UsersRound } from 'lucide-react'
import { api } from '../../../shared/api/client'

export const POSKO_ENDPOINT = '/student/posko'
type Rec = Record<string, unknown>
type PoskoResponse = Rec | { data?: Rec; posko?: Rec; post?: Rec }

function pick(obj: unknown, keys: string[]) { if (!obj || typeof obj !== 'object') return undefined; const rec = obj as Rec; for (const key of keys) if (rec[key] !== undefined && rec[key] !== null && rec[key] !== '') return rec[key]; return undefined }
function text(v: unknown, fb = '-') { if (v === null || v === undefined || v === '') return fb; if (typeof v === 'object') return fb; return String(v) }
function normalize(raw: PoskoResponse): Rec { return ((raw as any)?.data || (raw as any)?.posko || (raw as any)?.post || raw || {}) as Rec }
function Row({ label, value }: { label: string; value: unknown }) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0"><span className="text-sm text-slate-500">{label}</span><span className="text-right text-sm font-medium text-slate-800">{text(value)}</span></div> }

export function PoskoPage() {
  const q = useQuery({ queryKey: ['student-posko'], queryFn: () => api.get<PoskoResponse>(POSKO_ENDPOINT).then((r) => normalize(r.data)), retry: false })
  const data = useMemo(() => q.data ?? {}, [q.data])
  const members = (pick(data, ['anggota', 'members', 'mahasiswa', 'students']) as unknown[]) || []
  const maps = text(pick(data, ['maps_url', 'map_url', 'google_maps', 'location_url']), '')
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm"><div><h2 className="text-lg font-semibold text-slate-800">Posko Mahasiswa</h2><p className="text-sm text-slate-500">Endpoint: {POSKO_ENDPOINT}</p></div><button onClick={() => q.refetch()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"><RefreshCcw className="h-4 w-4" /> Refresh</button></div>
    {q.isLoading && <div className="rounded-2xl border bg-white p-5 text-slate-500">Memuat posko...</div>}
    {q.isError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">Gagal membaca data posko.</div>}
    {!q.isLoading && !q.isError && <div className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2"><div className="mb-4 flex items-center gap-3"><Home className="h-6 w-6 text-emerald-700" /><div><h3 className="font-semibold text-slate-800">{text(pick(data, ['nama', 'name', 'nama_posko', 'title']))}</h3><p className="text-sm text-slate-500">{text(pick(data, ['desa', 'village', 'kelurahan']))}, {text(pick(data, ['kecamatan', 'district']))}</p></div></div><Row label="Alamat" value={pick(data, ['alamat', 'address', 'lokasi', 'location'])} /><Row label="Koordinator" value={pick(data, ['koordinator', 'coordinator', 'ketua', 'leader'])} /><Row label="Kontak" value={pick(data, ['kontak', 'phone', 'no_hp', 'telepon'])} /><Row label="DPL" value={pick(data, ['dpl', 'dpl_name', 'nama_dpl'])} />{maps && <a href={maps} target="_blank" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"><MapPin className="h-4 w-4" /> Buka Maps</a>}</article>
      <aside className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 font-semibold text-slate-800"><UsersRound className="h-5 w-5 text-emerald-700" /> Anggota</div>{members.length ? <div className="space-y-2">{members.map((m, i) => <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="font-medium text-slate-800">{text(pick(m, ['nama', 'name']))}</div><div className="text-slate-500">{text(pick(m, ['nim', 'student_number']))}</div></div>)}</div> : <p className="text-sm text-slate-500">Belum ada anggota.</p>}</aside>
      <article className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-3"><h3 className="mb-3 font-semibold text-slate-800">Info Tambahan</h3><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Row label="Kab/Kota" value={pick(data, ['kabupaten', 'kota', 'city', 'regency'])} /><Row label="Provinsi" value={pick(data, ['provinsi', 'province'])} /><Row label="Periode" value={pick(data, ['periode', 'period'])} /><Row label="Status" value={pick(data, ['status'])} /></div></article>
    </div>}
  </section>
}
