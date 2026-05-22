'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';

type Period = { id: number; name?: string; periode?: string };
type PlotResult = { mode?: 'simulasi' | 'real'; safe_note?: string; meta?: Record<string, unknown>; summary: Record<string, number | string>; groups: Array<{ no:number; code:string; nama_kelompok:string; warnings?: string[]; stats?: Record<string, unknown>; location?: { full_name?: string; regency_name?: string; district_name?: string; village_name?: string; address?: string; latitude?: string | number | null; longitude?: string | number | null; maps_url?: string | null; capacity?: number | string | null; geofence_radius_meters?: number | string | null }; members: Array<{ nim?: string; nama?: string; gender?: string; fakultas?: string; prodi?: string; origin_regency?: string; gpa?: number; sks?: number; semester?: number; batch_year?: number; warnings?: string[] }> }>; unplaced: unknown[]; applied?: boolean; message?: string };

function unwrap<T>(res: unknown): T { const r = res as { data?: { data?: T } }; return (r.data?.data ?? r.data) as T; }

export default function AutoPlottingPage(): React.JSX.Element {
  const [periodeId, setPeriodeId] = useState<number | ''>('');
  const [groupSize, setGroupSize] = useState(15);
  const [result, setResult] = useState<PlotResult | null>(null);

  const periods = useQuery({ queryKey: ['admin','periode','plotting'], queryFn: async () => unwrap<{ data?: Period[]; items?: Period[]; }>(await rawApi.get('/admin/periode')) });
  const periodItems = (periods.data?.data ?? periods.data?.items ?? []) as Period[];

  const simulate = useMutation({
    mutationFn: async () => unwrap<PlotResult>(await rawApi.post('/admin/plotting-otomatis/simulate', { periode_id: periodeId, group_size: groupSize })),
    onSuccess: (data) => { setResult(data); toast.success('Mode SIMULASI selesai — data real tidak berubah'); },
    onError: () => toast.error('Simulasi gagal'),
  });

  const apply = useMutation({
    mutationFn: async () => unwrap<PlotResult>(await rawApi.post('/admin/plotting-otomatis/apply', { periode_id: periodeId, group_size: groupSize, confirm: true, mode: 'real' })),
    onSuccess: (data) => { setResult(data); toast.success(data.message || 'Mode REAL diterapkan'); },
    onError: () => toast.error('Mode real gagal'),
  });

  return <div className="space-y-6 p-6">
    <div><h1 className="text-2xl font-black uppercase text-slate-900">Plotting Otomatis KKN Reguler</h1><p className="text-sm text-slate-500">2 mode: Simulasi aman tanpa write DB, Real untuk menerapkan ke data produksi.</p></div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4"><p className="font-black text-teal-900">MODE SIMULASI</p><p className="text-sm text-teal-800">Hanya hitung preview. Tidak membuat kelompok. Tidak update peserta.</p></div>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-black text-rose-900">MODE REAL</p><p className="text-sm text-rose-800">Menulis ke DB: kelompok_kkn + peserta_kkn.kelompok_id. Butuh konfirmasi.</p></div>
    </div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-wrap gap-3 items-end">
      <div><label className="text-xs font-bold text-slate-500 uppercase">Periode</label><select className="mt-1 h-10 min-w-72 rounded-lg border px-3" value={periodeId} onChange={(e)=>setPeriodeId(e.target.value ? Number(e.target.value) : '')}><option value="">Pilih periode</option>{periodItems.map((p)=><option key={p.id} value={p.id}>{p.name || p.periode || `Periode #${p.id}`}</option>)}</select></div>
      <div><label className="text-xs font-bold text-slate-500 uppercase">Anggota/kelompok</label><input className="mt-1 h-10 w-24 rounded-lg border px-3" type="number" min={10} max={20} value={groupSize} onChange={(e)=>setGroupSize(Number(e.target.value)||15)} /></div>
      <button disabled={!periodeId || simulate.isPending} onClick={()=>simulate.mutate()} className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-bold text-white disabled:opacity-50">Jalankan Simulasi</button>
      <button disabled={!result || apply.isPending || (result?.summary?.unplaced ?? 1) !== 0} onClick={()=>confirm('MODE REAL akan mengubah data produksi. Lanjutkan?') && apply.mutate()} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-50">Terapkan Real</button>
    </div>
    {result && <>
      <div className={result.mode === 'real' ? 'rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900' : 'rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-900'}>{result.safe_note || (result.mode === 'real' ? 'Mode real' : 'Mode simulasi: data real tidak berubah.')}</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{Object.entries(result.summary).map(([k,v])=><div key={k} className="rounded-xl border bg-white p-4"><p className="text-xs uppercase text-slate-500 font-bold">{k}</p><p className="text-2xl font-black text-slate-900">{String(v)}</p></div>)}</div>
      {result.meta && <div className="rounded-2xl border bg-white p-4"><p className="mb-2 text-xs font-black uppercase text-slate-500">Meta simulasi data real</p><pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(result.meta, null, 2)}</pre></div>}
      <div className="rounded-2xl border bg-white overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3 text-left">Kelompok</th><th className="p-3 text-left">Lokasi real</th><th className="p-3 text-left">Lat/Lon</th><th className="p-3 text-left">Kapasitas</th><th className="p-3 text-left">Stats</th><th className="p-3 text-left">Warning</th></tr></thead><tbody>{result.groups.slice(0,100).map((g)=>{const l=g.members.filter(m=>m.gender==='L').length; const loc=g.location; return <tr key={g.code} className="border-t align-top"><td className="p-3 font-bold">{g.nama_kelompok}<div className="text-xs font-normal text-slate-500">{g.code}</div></td><td className="p-3"><div>{loc?.full_name || loc?.regency_name || '-'}</div><div className="text-xs text-slate-500">{loc?.address || '-'}</div></td><td className="p-3 font-mono text-xs">{loc?.latitude && loc?.longitude ? <a className="text-teal-700 underline" href={loc.maps_url || '#'} target="_blank">{loc.latitude}, {loc.longitude}</a> : 'Belum ada koordinat'}</td><td className="p-3">{String(loc?.capacity ?? '-')}<div className="text-xs text-slate-500">radius {String(loc?.geofence_radius_meters ?? '-')}m</div></td><td className="p-3 text-xs"><div>Anggota: {g.members.length}</div><div>L/P: {l}/{g.members.length-l}</div><div>IPK avg: {String(g.stats?.avg_gpa ?? '-')}</div></td><td className="p-3 text-xs text-amber-700">{g.warnings?.join(', ') || '-'}</td></tr>})}</tbody></table></div>
      <div className="rounded-2xl border bg-white overflow-auto"><table className="w-full text-xs"><thead className="bg-slate-50 uppercase text-slate-500"><tr><th className="p-2 text-left">Kelompok</th><th className="p-2 text-left">NIM</th><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Gender</th><th className="p-2 text-left">Fak/Prodi</th><th className="p-2 text-left">IPK/SKS/Smt</th><th className="p-2 text-left">Asal</th></tr></thead><tbody>{result.groups.flatMap(g=>g.members.map(m=><tr key={`${g.code}-${m.nim}`} className="border-t"><td className="p-2">{g.code}</td><td className="p-2 font-mono">{m.nim}</td><td className="p-2">{m.nama}</td><td className="p-2">{m.gender}</td><td className="p-2">{m.fakultas || '-'} / {m.prodi || '-'}</td><td className="p-2">{String(m.gpa ?? '-')} / {String(m.sks ?? '-')} / {String(m.semester ?? '-')}</td><td className="p-2">{m.origin_regency || '-'}</td></tr>))}</tbody></table></div>
    </>}
  </div>;
}
