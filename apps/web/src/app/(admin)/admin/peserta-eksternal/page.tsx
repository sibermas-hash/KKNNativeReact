'use client';

import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { Download, Loader2, Search, Users } from 'lucide-react';
import { useState } from 'react';

type Batch = { id:number; home_university:string; program_name?:string; target_regency?:string|null; students_count?:number; periode?:{ name?:string; periode?:number } };
type Row = { id:number; external_nim:string; home_university:string; external_faculty?:string|null; external_study_program?:string|null; mahasiswa?:{ nama?:string; nim?:string; peserta?:Array<{ status:string; kelompok?:{ nama_kelompok?:string; lokasi?:{ regency_name?:string } } }> } };
type Paginated<T> = { data?: T[] };

function unwrap<T>(res: unknown): T {
  const body = typeof res === 'object' && res !== null && 'data' in res ? (res as { data?: unknown }).data : res;
  return (typeof body === 'object' && body !== null && 'data' in body ? (body as { data?: unknown }).data : body) as T;
}
function asArray<T>(v: T[] | Paginated<T> | null | undefined): T[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  return [];
}

export default function PesertaEksternalPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const batchesQ = useQuery<Batch[]>({
    queryKey:['external-batches'],
    queryFn: async()=> asArray<Batch>(unwrap(await rawApi.get('/admin/peserta-eksternal/batches'))),
    placeholderData: [],
  });
  const listQ = useQuery<Paginated<Row> | Row[]>({
    queryKey:['external-participants', search],
    queryFn: async()=> unwrap<Paginated<Row> | Row[]>(await rawApi.get('/admin/peserta-eksternal', { params:{ per_page:100, search: search || undefined } })),
    placeholderData: { data: [] },
  });
  const batches = batchesQ.data ?? [];
  const rows: Row[] = asArray<Row>(listQ.data);
  const totalParticipants = batches.reduce((sum, batch) => sum + (batch.students_count ?? 0), 0);
  const hasError = batchesQ.isError || listQ.isError;

  return <main className="space-y-6 p-1">
    <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-slate-900 p-6 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">KKN Reguler</p>
      <h1 className="mt-2 text-2xl font-black">Peserta Eksternal</h1>
      <p className="mt-1 text-sm text-cyan-50">Import mahasiswa mitra/kolaborasi sebagai peserta KKN Reguler. Status tetap peserta KKN, dengan penanda eksternal.</p>
    </div>

    {hasError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Sebagian data belum bisa dimuat. Cek akses role admin/API, lalu refresh.</div>}

    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Peserta</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">{totalParticipants}</h2>
        <p className="mt-1 text-sm text-slate-500">Dari {batches.length} batch kampus</p>
      </div>
      {batches.map(b => <div key={b.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Batch Kampus</p>
        <h2 className="mt-1 font-bold text-slate-900">{b.home_university}</h2>
        <p className="mt-1 text-sm text-slate-500">{b.target_regency ?? 'Target belum diisi'} · {b.students_count ?? 0} peserta</p>
      </div>)}
    </section>

    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div className="flex items-center gap-2 font-bold text-slate-800"><Users size={18}/> Daftar Peserta Eksternal {listQ.isFetching && <Loader2 size={14} className="animate-spin text-slate-400" />}</div><div className="flex flex-wrap items-center gap-2"><label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari nama/NIM/kampus" className="w-56 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-cyan-400" /></label><a className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800" href="/api/v1/admin/peserta-eksternal/export"><Download size={14}/> Export CSV</a></div></div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="w-14 px-4 py-3 text-center">No</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIM Asal</th><th className="px-4 py-3">Kampus</th><th className="px-4 py-3">Fak/Prodi Asal</th><th className="px-4 py-3">Kelompok</th></tr></thead><tbody>{rows.length === 0 ? <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>Belum ada peserta eksternal.</td></tr> : rows.map((r, idx)=>{const p=r.mahasiswa?.peserta?.[0]; return <tr key={r.id} className="border-t"><td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td><td className="px-4 py-3 font-medium">{r.mahasiswa?.nama ?? '-'}</td><td className="px-4 py-3">{r.external_nim}</td><td className="px-4 py-3">{r.home_university}</td><td className="px-4 py-3">{r.external_faculty ?? '-'} / {r.external_study_program ?? '-'}</td><td className="px-4 py-3">{p?.kelompok?.nama_kelompok ?? 'Belum ditempatkan'} {p?.kelompok?.lokasi?.regency_name ? `(${p.kelompok.lokasi.regency_name})` : ''}</td></tr>})}</tbody></table></div>
    </section>
  </main>;
}
