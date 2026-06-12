import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/api/client'

type WorkProgram = {
  id?: number | string
  title?: string
  name?: string
  description?: string
  location?: string
  date?: string
  tanggal?: string
  status?: string
  target?: string
  budget?: number | string
  created_at?: string
}

const endpoints = {
  list: '/student/work-programs',
  detail: (id: string | number) => `/student/work-programs/${id}`,
  create: '/student/work-programs',
}

const schema = z.object({
  title: z.string().min(3, 'Nama program minimal 3 karakter'),
  description: z.string().min(5, 'Deskripsi minimal 5 karakter'),
  location: z.string().optional(),
  date: z.string().optional(),
  target: z.string().optional(),
  budget: z.string().optional(),
})

type Form = z.infer<typeof schema>
const empty: Form = { title: '', description: '', location: '', date: '', target: '', budget: '' }

function errMsg(error: unknown) { return error instanceof Error ? error.message : 'Terjadi kesalahan.' }
function label(p: WorkProgram) { return p.title || p.name || `Program #${p.id ?? '-'}` }

export function WorkProgramsPage({ mode, id }: { mode: 'list' | 'create' | 'detail'; id?: string }) {
  if (mode === 'create') return <CreateWorkProgram />
  if (mode === 'detail' && id) return <WorkProgramDetail id={id} />
  return <WorkProgramList />
}

function WorkProgramList() {
  const q = useQuery({ queryKey: ['work-programs'], queryFn: () => api.get<WorkProgram[]>(endpoints.list).then((r) => r.data) })
  const items = q.data ?? []
  if (q.isLoading) return <div className="text-slate-500">Memuat program kerja...</div>
  if (q.isError) return <div className="rounded-xl bg-amber-50 p-4 text-amber-800">Gagal memuat program kerja: {errMsg(q.error)}</div>
  return <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-800">Program Kerja</h2><p className="text-sm text-slate-500">Endpoint: {endpoints.list}</p></div><a href="/mahasiswa/program-kerja/buat" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Buat</a></div>{!items.length ? <p className="text-sm text-slate-500">Belum ada program kerja.</p> : <div className="divide-y">{items.map((p, i) => p.id ? <a key={p.id} href={`/mahasiswa/program-kerja/${p.id}`} className="block py-3 hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-slate-800">{label(p)}</div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{p.status || 'draft'}</span></div><p className="line-clamp-2 text-sm text-slate-600">{p.description || '-'}</p><p className="text-xs text-slate-500">{p.date || p.tanggal || p.created_at || '-'}</p></a> : <div key={i} className="py-3"><div className="font-medium text-slate-800">{label(p)}</div><p className="line-clamp-2 text-sm text-slate-600">{p.description || '-'}</p></div>)}</div>}</section>
}

function WorkProgramDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ['work-program', id], queryFn: () => api.get<WorkProgram>(endpoints.detail(id)).then((r) => r.data) })
  if (q.isLoading) return <div className="text-slate-500">Memuat detail program...</div>
  if (q.isError) return <div className="rounded-xl bg-amber-50 p-4 text-amber-800">Gagal memuat detail: {errMsg(q.error)}</div>
  const p = q.data
  if (!p) return <div className="rounded-xl border bg-white p-5 text-slate-500">Program tidak ditemukan.</div>
  return <section className="rounded-2xl border bg-white p-5 shadow-sm"><a href="/mahasiswa/program-kerja" className="text-sm font-medium text-emerald-700">← Kembali</a><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold text-slate-800">{label(p)}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{p.status || 'draft'}</span></div><dl className="mt-4 grid gap-3 text-sm md:grid-cols-2"><div><dt className="text-slate-500">Tanggal</dt><dd className="font-medium text-slate-800">{p.date || p.tanggal || '-'}</dd></div><div><dt className="text-slate-500">Lokasi</dt><dd className="font-medium text-slate-800">{p.location || '-'}</dd></div><div><dt className="text-slate-500">Sasaran</dt><dd className="font-medium text-slate-800">{p.target || '-'}</dd></div><div><dt className="text-slate-500">Anggaran</dt><dd className="font-medium text-slate-800">{p.budget ?? '-'}</dd></div></dl><p className="mt-4 whitespace-pre-wrap text-slate-700">{p.description || '-'}</p><p className="mt-4 text-xs text-slate-500">Endpoint: {endpoints.detail(id)}</p></section>
}

function CreateWorkProgram() {
  const qc = useQueryClient()
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const payload = useMemo(() => ({ ...form, budget: form.budget ? Number(form.budget) : undefined }), [form])
  const m = useMutation({ mutationFn: () => api.post(endpoints.create, payload).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['work-programs'] }) })
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = () => { const parsed = schema.safeParse(form); if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))); return } setErrors({}); m.mutate() }
  return <section className="rounded-2xl border bg-white p-5 shadow-sm"><a href="/mahasiswa/program-kerja" className="text-sm font-medium text-emerald-700">← Kembali</a><h2 className="mt-3 font-semibold text-slate-800">Buat Program Kerja</h2><div className="mt-4 grid gap-3"><input value={form.title} onChange={set('title')} placeholder="Nama program" className="rounded-xl border px-3 py-2 text-sm" />{errors.title && <p className="text-xs text-red-600">{errors.title}</p>}<textarea value={form.description} onChange={set('description')} placeholder="Deskripsi" className="min-h-28 rounded-xl border px-3 py-2 text-sm" />{errors.description && <p className="text-xs text-red-600">{errors.description}</p>}<div className="grid gap-3 md:grid-cols-2"><input value={form.location} onChange={set('location')} placeholder="Lokasi" className="rounded-xl border px-3 py-2 text-sm" /><input type="date" value={form.date} onChange={set('date')} className="rounded-xl border px-3 py-2 text-sm" /><input value={form.target} onChange={set('target')} placeholder="Sasaran" className="rounded-xl border px-3 py-2 text-sm" /><input value={form.budget} onChange={set('budget')} type="number" placeholder="Anggaran" className="rounded-xl border px-3 py-2 text-sm" /></div><button disabled={m.isPending} onClick={submit} className="w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{m.isPending ? 'Menyimpan...' : 'Simpan'}</button></div><p className="mt-3 text-xs text-slate-500">Endpoint: {endpoints.create}. Payload JSON: title, description, location?, date?, target?, budget?</p>{m.isError && <p className="mt-2 text-sm text-red-600">{errMsg(m.error)}</p>}{m.isSuccess && <p className="mt-2 text-sm text-emerald-700">Program kerja tersimpan.</p>}</section>
}
