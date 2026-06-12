import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, ImageIcon, RefreshCcw } from 'lucide-react'
import { api } from '../../../shared/api/client'

export const POSTER_ENDPOINT = '/student/poster'
type Rec = Record<string, unknown>
type Resp = Rec[] | Rec | { data?: Rec[]; items?: Rec[]; posters?: Rec[]; poster?: Rec }
function arr(raw: Resp): Rec[] { if (Array.isArray(raw)) return raw; const r = raw as any; return r?.data || r?.items || r?.posters || (r?.poster ? [r.poster] : r ? [r] : []) }
function pick(o: unknown, keys: string[]) { if (!o || typeof o !== 'object') return undefined; const r = o as Rec; for (const k of keys) if (r[k]) return r[k]; return undefined }
function text(v: unknown, fb = '-') { return v === null || v === undefined || v === '' || typeof v === 'object' ? fb : String(v) }

export function PosterPage() {
  const q = useQuery({ queryKey: ['student-poster'], queryFn: () => api.get<Resp>(POSTER_ENDPOINT).then((r) => arr(r.data)), retry: false })
  const rows = useMemo(() => q.data ?? [], [q.data])
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm"><div><h2 className="text-lg font-semibold text-slate-800">Poster KKN</h2><p className="text-sm text-slate-500">Endpoint: {POSTER_ENDPOINT}</p></div><button onClick={() => q.refetch()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"><RefreshCcw className="h-4 w-4" /> Refresh</button></div>
    {q.isLoading && <div className="rounded-2xl border bg-white p-5 text-slate-500">Memuat poster...</div>}
    {q.isError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">Gagal membaca poster.</div>}
    {!q.isLoading && !q.isError && rows.length === 0 && <div className="rounded-2xl border bg-white p-5 text-slate-500">Belum ada poster.</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((p, i) => { const img = text(pick(p, ['image_url', 'gambar', 'poster', 'file_url', 'url']), ''); const dl = text(pick(p, ['download_url', 'file_url', 'url']), img); return <article key={text(pick(p, ['id']), String(i))} className="overflow-hidden rounded-2xl border bg-white shadow-sm">{img ? <img src={img} alt="Poster KKN" className="aspect-[4/5] w-full object-cover" /> : <div className="grid aspect-[4/5] place-items-center bg-slate-100 text-slate-400"><ImageIcon className="h-12 w-12" /></div>}<div className="space-y-3 p-5"><div><h3 className="font-semibold text-slate-800">{text(pick(p, ['judul', 'title', 'nama', 'name']), 'Poster KKN')}</h3><p className="text-sm text-slate-500">{text(pick(p, ['deskripsi', 'description', 'periode', 'period']))}</p></div>{dl && <a href={dl} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"><Download className="h-4 w-4" /> Unduh/Buka</a>}</div></article> })}</div>
  </section>
}
